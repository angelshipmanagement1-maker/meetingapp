# MeetTime Troubleshooting Guide

## Common Issues and Solutions

### "Failed to join meeting" Error

This error typically occurs due to one of the following issues:

#### 1. Backend Server Not Running
**Symptoms:** Connection errors, socket timeouts
**Solution:**
- Make sure the backend server is running on port 3001
- Run `npm run dev` in the `server` directory
- Check if `http://localhost:3001/health` returns a response

#### 2. Frontend-Backend Connection Issues
**Symptoms:** API calls failing, socket connection errors
**Solution:**
- Verify the `VITE_SERVER_URL` in your `.env` file
- For local development: `VITE_SERVER_URL=http://localhost:3001`
- For ngrok: `VITE_SERVER_URL=https://your-ngrok-url.ngrok-free.app`

#### 3. Camera/Microphone Permission Denied
**Symptoms:** Media access errors, getUserMedia failures
**Solution:**
- Allow camera and microphone permissions in your browser
- Check browser settings for site permissions
- Try refreshing the page after granting permissions
- The app will work with audio-only if video fails

#### 4. CORS Issues
**Symptoms:** Network errors, blocked requests
**Solution:**
- Ensure your frontend URL is in the server's CORS_ORIGINS
- For ngrok, the server automatically allows `*.ngrok.io` and `*.ngrok-free.app`
- Check the server console for CORS-related errors

#### 5. Socket.IO Connection Problems
**Symptoms:** Real-time features not working, connection timeouts
**Solution:**
- Check if WebSocket connections are blocked by firewall/proxy
- Try using polling transport only (modify socketService.ts)
- Verify the server is accessible from your network

## Debugging Steps

### 1. Run Connection Diagnostics
Visit `/test` in your browser to run comprehensive connection tests:
- Backend API connectivity
- Socket.IO connection
- Media device access
- Meeting creation

### 2. Check Browser Console
Open Developer Tools (F12) and look for:
- Network errors (red entries in Network tab)
- JavaScript errors (Console tab)
- WebSocket connection status

### 3. Verify Environment Configuration

**Frontend (.env):**
```
VITE_SERVER_URL=http://localhost:3001
VITE_APP_NAME=MeetTime
```

**Backend (server/.env):**
```
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://*.ngrok.io,https://*.ngrok-free.app
```

### 4. Test Individual Components

**Test Backend:**
```bash
curl http://localhost:3001/health
```

**Test Socket Connection:**
```javascript
// In browser console
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
```

## Quick Fixes

### Reset Everything
1. Stop all servers
2. Clear browser cache and localStorage
3. Restart backend: `cd server && npm run dev`
4. Restart frontend: `npm run dev`
5. Try creating a new meeting

### Browser-Specific Issues
- **Chrome:** Check site permissions in Settings > Privacy > Site Settings
- **Firefox:** Allow camera/microphone in address bar icon
- **Safari:** Enable camera/microphone in Safari > Preferences > Websites

### Network Issues
- Try disabling VPN/proxy temporarily
- Check if corporate firewall blocks WebSocket connections
- Test on different network (mobile hotspot)

## Getting Help

If you're still experiencing issues:

1. Run the diagnostics at `/test` and note any failures
2. Check browser console for error messages
3. Verify all environment variables are set correctly
4. Try the quick reset steps above

## Development Mode vs Production

**Development (localhost):**
- Uses `http://localhost:3001` for backend
- CORS is more permissive
- Detailed error logging enabled

**Production (ngrok/deployed):**
- Uses HTTPS URLs
- Stricter CORS policies
- May require additional security headers

Remember to update your `.env` files when switching between development and production environments.