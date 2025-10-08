const { Server } = require('socket.io');

let io;
let meetings = new Map();
let connectedUsers = new Map();

const allowedOrigins = [
  'https://www.meetingapp.org',
  'https://meetingapp.org',
  'https://meetingapp-git-main-angelseafarerswebsite.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080'
];

module.exports = async (req, res) => {
  try {
    // CORS headers
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Initialize Socket.IO once
    if (!io) {
      io = new Server({
        cors: {
          origin: allowedOrigins,
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['polling', 'websocket']
      });

      io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('meeting:join', (data) => {
          try {
            const { meetingId, displayName, isHost, participantId } = data;

            connectedUsers.set(socket.id, {
              participantId,
              meetingId,
              name: displayName,
              isHost
            });

            if (!meetings.has(meetingId)) {
              meetings.set(meetingId, {
                id: meetingId,
                participants: new Map(),
                chatMessages: [],
                currentDateTime: new Date().toISOString(),
                datetimeVersion: 0
              });
            }

            const meeting = meetings.get(meetingId);
            meeting.participants.set(participantId, {
              id: participantId,
              name: displayName,
              role: isHost ? 'host' : 'participant',
              socketId: socket.id,
              isMuted: false,
              isVideoOff: false,
              joinedAt: new Date().toISOString()
            });

            socket.emit('meeting:joined', {
              participantId,
              participants: Array.from(meeting.participants.values()),
              currentDateTime: meeting.currentDateTime,
              datetimeVersion: meeting.datetimeVersion,
              chatMessages: meeting.chatMessages.slice(-20)
            });

            socket.to(meetingId).emit('meeting:participant-joined', {
              id: participantId,
              name: displayName,
              isHost,
              isMuted: false,
              isVideoOff: false,
              joinedAt: new Date().toISOString()
            });

            socket.join(meetingId);
            console.log(`${displayName} joined meeting ${meetingId}`);

          } catch (error) {
            console.error('Meeting join error:', error);
            socket.emit('error', { message: error.message });
          }
        });

        socket.on('disconnect', () => {
          const userInfo = connectedUsers.get(socket.id);
          if (userInfo && meetings.has(userInfo.meetingId)) {
            const meeting = meetings.get(userInfo.meetingId);
            meeting.participants.delete(userInfo.participantId);
            
            socket.to(userInfo.meetingId).emit('meeting:participant-left', {
              participantId: userInfo.participantId,
              reason: 'disconnected'
            });
          }
          connectedUsers.delete(socket.id);
        });
      });
    }

    // Handle Socket.IO requests
    if (req.url && req.url.includes('/socket.io/')) {
      return new Promise((resolve) => {
        io.engine.handleRequest(req, res);
        res.on('finish', resolve);
      });
    }

    // Health check
    res.status(200).json({
      message: 'Socket.IO server running',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Socket.IO error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};