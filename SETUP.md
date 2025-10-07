# 🚀 MeetTime Setup Guide

## Quick Start (Local Development)

1. **Install Dependencies:**
```bash
npm install
cd server && npm install
```

2. **Start Everything:**
```bash
# Double-click start-all.bat or run:
start-all.bat
```

## 🌐 Ngrok Setup (Public Access)

### Step 1: Start Services
Run `start-all.bat` - this will open 4 windows:
- Backend Server (port 3001)
- Frontend Server (port 8080) 
- Backend Ngrok Tunnel
- Frontend Ngrok Tunnel

### Step 2: Get Ngrok URLs
From the ngrok windows, copy the URLs:
- **Backend**: `https://abc123.ngrok-free.app` 
- **Frontend**: `https://def456.ngrok-free.app`

### Step 3: Update Environment
Edit `.env` file:
```
VITE_SERVER_URL=https://your-backend-ngrok-url.ngrok-free.app
```

### Step 4: Access Your App
- Use the **frontend ngrok URL** to access your app
- Share this URL with others to join meetings

## 🎥 Using the App

1. **Create Meeting**: Click "Create Meeting"
2. **Join Meeting**: Enter meeting ID or use shared link
3. **Video Chat**: Camera streams automatically shared between participants
4. **Live DateTime**: Host can edit meeting time in real-time
5. **Chat**: Send messages during the meeting

## 🔧 Troubleshooting

- **Camera not working**: Allow camera permissions in browser
- **No video sharing**: Check WebRTC connection in console
- **Ngrok blocked**: Refresh the page, ngrok free tier has limits
- **Connection issues**: Restart all services with `start-all.bat`

## 📱 Browser Support
- Chrome/Edge (recommended)
- Firefox
- Safari (limited WebRTC support)

**Note**: HTTPS is required for camera access in production (ngrok provides this automatically)