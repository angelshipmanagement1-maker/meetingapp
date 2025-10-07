# Server Setup Instructions

## Quick Setup

1. **Install server dependencies:**
   ```bash
   npm install express socket.io cors nodemon
   ```

2. **Start the signaling server:**
   ```bash
   node server.js
   ```

3. **In another terminal, start the frontend:**
   ```bash
   npm run dev
   ```

## What this fixes:

- **WebRTC Signaling**: The server handles offer/answer/ICE candidate exchange between peers
- **Meeting Management**: Tracks participants joining/leaving meetings  
- **Real-time Communication**: Enables video/audio streaming between participants

## How it works:

1. When someone creates/joins a meeting, they connect to the signaling server
2. The server coordinates WebRTC peer connections between participants
3. Video/audio streams are exchanged directly between browsers (P2P)
4. The server only handles the initial connection setup

## Testing:

1. Open `http://localhost:5173` in two different browser windows/tabs
2. Create a meeting in one window
3. Copy the meeting link and join from the second window
4. You should now see both video streams

The server runs on port 3001 and the frontend on port 5173.