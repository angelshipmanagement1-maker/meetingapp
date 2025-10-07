# MeetTime Backend Server

A comprehensive, modular backend server for real-time video meetings with live datetime editing capabilities.

## Features

- **Secure Meeting Management**: Token-based authentication with anti-duplicate join enforcement
- **Real-time Communication**: Socket.IO for instant messaging and signaling
- **WebRTC Signaling**: Peer-to-peer connection establishment
- **Live DateTime Editing**: Host-controlled meeting time updates with conflict resolution
- **Host Controls**: Kick participants, generate join tokens, terminate meetings
- **Rate Limiting**: Protection against abuse and spam
- **Redis Integration**: Scalable session management and caching
- **Comprehensive Logging**: Winston-based logging with error tracking
- **Input Validation**: Joi-based request validation
- **Error Handling**: Centralized error management

## Architecture

```
src/
├── app.js              # Main application entry point
├── config/             # Configuration management
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── models/             # Data models
├── routes/             # API route definitions
├── services/           # Business logic
├── socket/             # Socket.IO event handlers
└── utils/              # Utilities (auth, redis, validation, logging)
```

## Quick Start

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Start Production Server**
```bash
npm start
```

## API Endpoints

### Meeting Management
- `POST /api/meetings/create` - Create new meeting
- `POST /api/meetings/join` - Join meeting with token
- `GET /api/meetings/:id` - Get meeting info
- `DELETE /api/meetings/:id` - Terminate meeting (host only)

### Host Controls
- `POST /api/meetings/:id/tokens` - Generate join token
- `PUT /api/meetings/:id/datetime` - Update meeting datetime
- `POST /api/meetings/:id/kick` - Kick participant
- `POST /api/meetings/:id/leave` - Leave meeting

### System
- `GET /health` - Health check
- `GET /` - API information

## Socket Events

### Client → Server
- `meeting:join` - Join meeting room
- `meeting:datetime:update` - Update meeting datetime (host only)
- `chat:message` - Send chat message
- `webrtc:offer/answer/ice-candidate` - WebRTC signaling
- `participant:update` - Update participant state
- `host:kick-participant` - Kick participant (host only)

### Server → Client
- `meeting:joined` - Meeting join confirmation
- `meeting:participant-joined/left` - Participant updates
- `meeting:datetime:changed` - DateTime update broadcast
- `chat:new-message` - New chat message
- `webrtc:offer/answer/ice-candidate` - WebRTC signaling relay
- `meeting:kicked` - Participant kicked notification
- `meeting:terminated` - Meeting ended notification

## Configuration

### Environment Variables
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_PARTICIPANTS_PER_MEETING=50
MEETING_EXPIRY_HOURS=24
TOKEN_EXPIRY_HOURS=24
```

### Redis (Optional)
The server works without Redis but provides enhanced features with it:
- Session persistence across server restarts
- Horizontal scaling support
- Better performance for large meetings

## Security Features

- **Token-based Authentication**: Secure meeting access
- **Rate Limiting**: Prevents abuse and spam
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable origin restrictions
- **Helmet Security**: HTTP security headers
- **Anti-duplicate Joins**: Prevents token reuse

## Development

### Project Structure
- **Modular Design**: Separated concerns with clear boundaries
- **Service Layer**: Business logic isolated from controllers
- **Middleware Stack**: Reusable authentication and validation
- **Error Handling**: Centralized error management
- **Logging**: Comprehensive request and error logging

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Setup
1. Set production environment variables
2. Configure Redis connection
3. Set up reverse proxy (nginx/cloudflare)
4. Enable HTTPS for WebRTC

### Scaling
- Use Redis adapter for Socket.IO clustering
- Deploy multiple instances behind load balancer
- Configure sticky sessions if needed

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Console output in development

### Metrics
Monitor these key metrics:
- Active meetings count
- Connected participants
- Message throughput
- Error rates
- Redis connection status

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify connection URL
   - Server continues without Redis (degraded mode)

2. **CORS Errors**
   - Update CORS_ORIGINS environment variable
   - Check frontend URL configuration

3. **WebRTC Connection Issues**
   - Ensure HTTPS in production
   - Configure TURN servers for NAT traversal
   - Check firewall settings

4. **High Memory Usage**
   - Monitor meeting cleanup
   - Check Redis memory usage
   - Review log file sizes

### Debug Mode
Set `NODE_ENV=development` for detailed logging and error information.

## License

MIT License - see LICENSE file for details.