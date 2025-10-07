const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import configurations and utilities
const config = require('./config');
const logger = require('./utils/logger');
const redisService = require('./utils/redis');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const meetingRoutes = require('./routes/meetings');

// Import socket handlers
const SocketHandlers = require('./socket/socketHandlers');

class MeetTimeServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const allowedOrigins = config.cors.origins;
          const isNgrok = origin.includes('.ngrok.io') || origin.includes('.ngrok-free.app');
          const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
          if (allowedOrigins.includes(origin) || isNgrok || isLocalhost) {
            callback(null, true);
          } else {
            console.warn('Socket.IO CORS blocked origin:', origin);
            callback(null, true); // Allow all origins in development
          }
        },
        methods: ["GET", "POST"],
        credentials: config.cors.credentials
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000  // 25 seconds
    });
    
    this.socketHandlers = new SocketHandlers(this.io);
  }

  async initialize() {
    try {
      // Connect to Redis (optional)
      await redisService.connect();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup socket handlers
      this.setupSocketHandlers();
      
      // Setup error handling
      this.setupErrorHandling();
      
      logger.info('MeetTime server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize server:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for WebRTC
      crossOriginEmbedderPolicy: false // Disable for WebRTC
    }));
    
    // Compression
    this.app.use(compression());
    
    // CORS - Allow ngrok domains and localhost
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list or is ngrok domain or localhost
        const allowedOrigins = config.cors.origins;
        const isNgrok = origin.includes('.ngrok.io') || origin.includes('.ngrok-free.app');
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        
        if (allowedOrigins.includes(origin) || isNgrok || isLocalhost) {
          callback(null, true);
        } else {
          console.warn('CORS blocked origin:', origin);
          callback(null, true); // Allow all origins in development
        }
      },
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'MeetTime server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        redis: redisService.isConnected
      });
    });

    // API routes
    this.app.use('/api/meetings', meetingRoutes);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'MeetTime API Server',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          meetings: '/api/meetings',
          websocket: '/socket.io'
        }
      });
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      this.socketHandlers.handleConnection(socket);
    });

    // Socket.IO middleware for authentication (optional)
    this.io.use((socket, next) => {
      // Add any socket authentication logic here
      logger.debug(`Socket connection attempt: ${socket.id}`);
      next();
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
    
    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  async start() {
    try {
      await this.initialize();
      
      this.server.listen(config.port, () => {
        logger.info(`MeetTime server running on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`CORS origins: ${config.cors.origins.join(', ')}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down MeetTime server...');
    
    try {
      // Close server
      this.server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Disconnect from Redis
      await redisService.disconnect();
      
      // Close socket connections
      this.io.close(() => {
        logger.info('Socket.IO server closed');
      });
      
      logger.info('MeetTime server shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new MeetTimeServer();
server.start();

module.exports = MeetTimeServer;