# MeetTime Deployment Guide

This guide covers deploying MeetTime (frontend + backend) to production using Vercel and various cloud providers.

## 🚀 Quick Deploy Options

### Option 1: Vercel + Railway (Recommended)

1. **Frontend**: Deploy to Vercel
2. **Backend**: Deploy to Railway
3. **Database**: Railway Redis (included)

### Option 2: Vercel + AWS

1. **Frontend**: Deploy to Vercel
2. **Backend**: Deploy to AWS EC2/EB
3. **Database**: AWS ElastiCache Redis

### Option 3: Docker Deployment

Use Docker Compose for full-stack deployment on any cloud provider.

---

## 📋 Prerequisites

- GitHub repository
- Vercel account
- Cloud provider account (Railway/AWS/DigitalOcean/etc.)
- Domain name (optional)

---

## 🔧 Environment Setup

### 1. Clone and Setup Repository

```bash
git clone https://github.com/angelshipmanagement1-maker/meetingapp.git
cd meetingapp

# Copy environment files
cp .env.example .env
cp server/.env.example server/.env
```

### 2. Configure Environment Variables

#### Frontend (.env)
```env
VITE_SERVER_URL=https://your-backend-domain.com
VITE_APP_NAME=MeetTime
VITE_APP_ENV=production
```

#### Backend (server/.env)
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
REDIS_URL=redis://your-redis-instance:6379
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

---

## 🌐 Frontend Deployment (Vercel)

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_SERVER_URL
vercel env add VITE_APP_NAME
```

### Method 2: GitHub Integration

1. Connect GitHub repository to Vercel
2. Vercel will auto-deploy on push to main
3. Configure environment variables in Vercel dashboard

### Vercel Configuration

The `vercel.json` file is already configured with:
- Static build settings
- SPA routing
- Security headers
- Build commands

---

## 🖥️ Backend Deployment Options

### Option A: Railway (Easiest)

1. **Create Railway Account**: https://railway.app
2. **Connect GitHub Repo**:
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository
3. **Configure Environment**:
   - Add environment variables from `server/.env.production`
   - Railway provides Redis automatically
4. **Deploy**: Railway auto-deploys on git push

### Option B: AWS EC2

```bash
# On your EC2 instance
sudo apt update
sudo apt install nodejs npm

# Clone repo
git clone https://github.com/yourusername/meetingapp.git
cd meetingapp/server

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'meettime-backend',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option C: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
cd server
docker build -t meettime-backend .
docker run -p 3001:3001 meettime-backend
```

---

## 🗄️ Database Setup

### Redis Setup

#### Railway (Automatic)
- Redis is included with Railway deployment
- No additional setup required

#### AWS ElastiCache
1. Create ElastiCache Redis cluster
2. Update `REDIS_URL` in environment variables

#### Local Redis
```bash
# Install Redis
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# For production, configure Redis persistence
```

---

## 🔒 Security Configuration

### Environment Variables Checklist

#### Frontend
- ✅ `VITE_SERVER_URL` - Backend API URL
- ✅ `VITE_APP_NAME` - Application name

#### Backend
- ✅ `JWT_SECRET` - Strong random secret (32+ characters)
- ✅ `REDIS_URL` - Redis connection URL
- ✅ `CORS_ORIGINS` - Allowed frontend domains
- ✅ `NODE_ENV=production`

### Security Headers

Already configured in:
- `vercel.json` - Frontend security headers
- `server/src/app.js` - Backend helmet middleware

---

## 🚀 CI/CD Pipeline

### GitHub Actions

The `.github/workflows/deploy.yml` includes:

1. **Frontend Tests**: Lint, type check, build
2. **Vercel Deployment**: Automatic deployment on push
3. **Backend Deployment**: Configurable for your provider
4. **Health Checks**: Post-deployment verification

### Required Secrets

Add to GitHub repository secrets:
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
VITE_SERVER_URL=https://your-backend.com
VITE_APP_NAME=MeetTime
BACKEND_URL=https://your-backend.com
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 🌍 Domain Configuration

### Vercel Custom Domain

1. Go to Vercel project settings
2. Add custom domain: `meetingapp.org`
3. Configure DNS records as follows:
   - **Type**: CNAME
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com`
   - **Type**: A
   - **Name**: `@`
   - **Value**: `76.76.21.21`
4. Update CORS origins in backend

### Backend Domain

Update your backend deployment's domain in:
- Frontend environment variables: `VITE_SERVER_URL=https://api.meetingapp.org`
- Backend CORS settings: `CORS_ORIGINS=https://meetingapp.org,https://www.meetingapp.org`

---

## 📊 Monitoring & Logs

### Backend Logs

#### Railway
```bash
railway logs
```

#### PM2 (AWS)
```bash
pm2 logs meettime-backend
pm2 monit
```

#### Docker
```bash
docker logs meettime-backend
```

### Frontend Monitoring

Vercel provides built-in analytics and error tracking.

---

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
- Check `CORS_ORIGINS` in backend
- Ensure HTTPS URLs in production

#### 2. WebRTC Connection Issues
- Verify STUN/TURN server configuration
- Check firewall settings

#### 3. Build Failures
- Check Node.js version compatibility
- Verify environment variables

#### 4. Redis Connection
- Ensure Redis URL is correct
- Check Redis server status

### Health Checks

```bash
# Frontend
curl https://your-frontend.vercel.app

# Backend
curl https://your-backend.com/health
```

---

## 📝 Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] Backend health check passes
- [ ] Camera/microphone permissions work
- [ ] Meeting creation/joining works
- [ ] WebRTC video/audio streams work
- [ ] Real-time features functional
- [ ] SSL certificates valid
- [ ] Domain DNS configured
- [ ] Environment variables set
- [ ] Monitoring/logging active

---

## 🎯 Performance Optimization

### Frontend
- ✅ Code splitting enabled
- ✅ Asset optimization
- ✅ CDN delivery via Vercel

### Backend
- ✅ Compression enabled
- ✅ Rate limiting configured
- ✅ Redis caching active

### Database
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Redis persistence

---

## 🔄 Updates & Maintenance

### Deploying Updates

1. **Push to main branch**: Auto-deploys via GitHub Actions
2. **Manual deployment**: Use Vercel/Railway dashboards
3. **Rollback**: Use deployment history in dashboards

### Monitoring

- Check Vercel analytics
- Monitor Railway/AWS metrics
- Review application logs regularly

---

## 📞 Support

For deployment issues:
1. Check Vercel/Railway documentation
2. Review GitHub Actions logs
3. Check application logs
4. Verify environment configuration

---

**🎉 Your MeetTime application is now production-ready!**

Deploy with confidence using the automated CI/CD pipeline and comprehensive monitoring setup.