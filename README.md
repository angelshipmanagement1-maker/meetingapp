<<<<<<< HEAD
# MeetTime - Real-time Video Conferencing with Live Time Control

A modern, production-ready video conferencing application built with React, TypeScript, Node.js, and WebRTC.

## ✨ Features

- **Real-time Video & Audio**: Crystal clear HD video calls with low latency
- **Live Clock Display**: Synchronized time display across all participants
- **Camera Preview**: Test your camera and microphone before joining
- **Host Controls**: Meeting management and participant controls
- **Real-time Chat**: Instant messaging during meetings
- **Screen Sharing**: Share your screen with participants
- **Mobile Responsive**: Works on all devices
- **Production Ready**: CI/CD, Docker, monitoring included

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/angelshipmanagement1-maker/meetingapp.git
cd meetingapp

# Install dependencies
npm install
cd server && npm install && cd ..

# Copy environment files
cp .env.example .env
cp server/.env.example server/.env

# Start development servers
npm run dev:both
```

Visit `http://localhost:8080` for the frontend and the backend runs on `http://localhost:3001`.

## 📦 Production Deployment

### Option 1: Vercel + Railway (Recommended)

1. **Frontend**: Connect to Vercel for automatic deployments
2. **Backend**: Deploy to Railway with built-in Redis
3. **Database**: Redis included with Railway

### Option 2: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Option 3: Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **Socket.io-client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **Redis** - Session storage and caching
- **JWT** - Authentication tokens

### Domain
- **Primary**: `https://meetingapp.org`
- **API**: `https://api.meetingapp.org`

### Real-time Features
- **WebRTC** - Peer-to-peer video/audio
- **Simple-Peer** - WebRTC wrapper library
- **Socket.io** - Signaling server

## 📁 Project Structure

```
meettime/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── services/          # API and WebRTC services
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── socket/        # WebSocket handlers
│   │   └── utils/         # Backend utilities
│   └── Dockerfile         # Backend Docker config
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Docker orchestration
└── DEPLOYMENT.md         # Production deployment guide
```

## 🔧 Development Scripts

```bash
# Frontend only
npm run dev

# Backend only
npm run server:dev

# Both frontend and backend
npm run dev:both

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 🌐 Environment Variables

### Frontend (.env)
```env
VITE_SERVER_URL=http://localhost:3001
VITE_APP_NAME=MeetTime
VITE_APP_ENV=development
```

### Backend (server/.env)
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:8080
```

## 🚀 Deployment

### Vercel (Frontend)
1. Connect your GitHub repo to Vercel
2. Set environment variables
3. Deploy automatically on push

### Railway (Backend)
1. Connect GitHub repo to Railway
2. Set environment variables
3. Redis is included automatically

### Docker
```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# Development with hot reload
docker-compose -f docker-compose.dev.yml up
```

## 📊 Monitoring

- **Frontend**: Vercel Analytics
- **Backend**: Application logs, health checks
- **Database**: Redis monitoring

## 🔒 Security

- JWT authentication
- CORS protection
- Rate limiting
- Security headers
- Input validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review GitHub Issues for known problems
- Create an issue for bugs or feature requests

---

**Built with ❤️ for seamless video conferencing experiences**
=======
# meetingapp
conference app
>>>>>>> a6f284e94f43ed4d4202e799f70e4169fd8cbe0c
