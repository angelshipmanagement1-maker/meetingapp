# Server Quick Start Guide

## 🚀 Start the Server

Simply run:
```bash
npm run dev
```

This will start the backend server on port 3001.

## 📁 Server Structure

All server-related files are in the `server/` folder:
- `server/src/app.js` - Main server entry point
- `server/src/config/` - Configuration files
- `server/src/routes/` - API routes
- `server/src/socket/` - WebSocket handlers
- `server/src/middleware/` - Express middleware
- `server/.env` - Environment variables

## 🔧 Available Scripts

- `npm run dev` - Start server (runs server in development mode)
- `npm run client` - Start React client only
- `npm run server` - Start server in production mode
- `npm run dev:both` - Start both client and server simultaneously

## 🌐 Server Endpoints

- **Health Check**: `http://localhost:3001/health`
- **API Base**: `http://localhost:3001/api/`
- **WebSocket**: `http://localhost:3001/socket.io`

## ⚙️ Configuration

The server is configured via `server/.env` file:
- Port: 3001
- CORS: Allows localhost:5173 (Vite dev server)
- Redis: Optional (for scaling)

## 🔍 Troubleshooting

1. **Port already in use**: Change PORT in `server/.env`
2. **CORS errors**: Add your frontend URL to CORS_ORIGINS in `server/.env`
3. **Dependencies**: Run `cd server && npm install`