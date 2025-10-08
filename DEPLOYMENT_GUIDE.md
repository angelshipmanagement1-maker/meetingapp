# MeetTime Deployment Guide

## Current Status
Your app is configured to work with your Vercel domain: `https://meetingapp-git-main-angelseafarerswebsite.vercel.app`

## For Local Development

1. **Start Local Development**:
   ```bash
   # Run this batch file
   START-LOCAL.bat
   
   # Or manually:
   npm install
   cd server && npm install && cd ..
   npm run dev:both
   ```

2. **Access Locally**:
   - Frontend: `http://localhost:8080`
   - Backend: `http://localhost:3001`

## For Production (Vercel)

### Current Configuration:
- **Domain**: `https://meetingapp-git-main-angelseafarerswebsite.vercel.app`
- **Socket.IO**: Routes through `/socket.io/` to `/api/socket.io`
- **Environment**: Production variables set in `vercel.json`

### Deploy Steps:
1. **Push to GitHub** (if connected to Vercel)
2. **Or deploy manually**:
   ```bash
   npm run build
   vercel --prod
   ```

### Verify Deployment:
1. **Health Check**: Visit `https://meetingapp-git-main-angelseafarerswebsite.vercel.app/api/health`
2. **Socket.IO**: Check `https://meetingapp-git-main-angelseafarerswebsite.vercel.app/socket.io/`
3. **Frontend**: Visit `https://meetingapp-git-main-angelseafarerswebsite.vercel.app`

## Environment Files

- `.env` - Production configuration (points to Vercel)
- `.env.local` - Local development (points to localhost:3001)
- `.env.production` - Production backup

## Key Files Updated

1. **Socket Service** (`src/services/socketService.ts`)
   - Fixed server URL detection
   - Proper production/development switching

2. **API Function** (`api/socket.io.js`)
   - Improved serverless Socket.IO setup
   - Better CORS handling

3. **Vercel Config** (`vercel.json`)
   - Proper routing for Socket.IO
   - Environment variables

## Troubleshooting

### If Socket.IO doesn't connect:
1. Check browser console for connection errors
2. Verify `/api/socket.io` endpoint responds
3. Check CORS settings in `api/socket.io.js`

### If local development fails:
1. Make sure backend server is running on port 3001
2. Use `START-LOCAL.bat` to start both servers
3. Check `.env.local` file exists

## Next Steps

1. **Test locally** with `START-LOCAL.bat`
2. **Deploy to Vercel** 
3. **Test production** at your Vercel URL
4. **Configure custom domain** if needed (update CORS origins)

Your app should now work properly on both local development and your Vercel production domain!