require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: '24h'
  },
  
  redis: {
    url: process.env.REDIS_URL || (process.env.NODE_ENV === 'production' ? 'redis://localhost:6379' : null),
    password: process.env.REDIS_PASSWORD || undefined,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173'],
    credentials: true
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  meeting: {
    maxParticipants: parseInt(process.env.MAX_PARTICIPANTS_PER_MEETING) || 50,
    expiryHours: parseInt(process.env.MEETING_EXPIRY_HOURS) || 24,
    tokenExpiryHours: parseInt(process.env.TOKEN_EXPIRY_HOURS) || 24
  },
  
  turn: {
    url: process.env.TURN_SERVER_URL,
    username: process.env.TURN_USERNAME,
    password: process.env.TURN_PASSWORD
  }
};

module.exports = config;