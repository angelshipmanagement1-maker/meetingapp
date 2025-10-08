const { Server } = require('socket.io');

// Global variables for serverless
let io;
let meetings = new Map();
let connectedUsers = new Map();

const allowedOrigins = [
  'https://meetingapp-git-main-angelseafarerswebsite.vercel.app',
  'https://www.meetingapp.org',
  'https://meetingapp-puce.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080'
];

module.exports = async (req, res) => {
  // Set CORS headers
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Initialize Socket.IO if not already done
  if (!io) {
    console.log('🚀 Initializing Socket.IO for Vercel...');
    
    io = new Server({
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Socket event handlers
    io.on('connection', (socket) => {
      console.log('🔗 Client connected:', socket.id);

      socket.on('meeting:join', async (data) => {
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
              hostId: isHost ? participantId : null,
              participants: new Map(),
              chatMessages: [],
              currentDateTime: new Date().toISOString(),
              datetimeVersion: 0,
              isActive: true
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
          console.log(`✅ ${displayName} joined meeting ${meetingId}`);

        } catch (error) {
          console.error('Meeting join error:', error);
          socket.emit('error', { message: error.message });
        }
      });

      // WebRTC signaling
      socket.on('webrtc:offer', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          socket.to(userInfo.meetingId).emit('webrtc:offer', {
            ...data,
            from: userInfo.participantId
          });
        }
      });

      socket.on('webrtc:answer', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          socket.to(userInfo.meetingId).emit('webrtc:answer', {
            ...data,
            from: userInfo.participantId
          });
        }
      });

      socket.on('webrtc:ice-candidate', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          socket.to(userInfo.meetingId).emit('webrtc:ice-candidate', {
            ...data,
            from: userInfo.participantId
          });
        }
      });

      // Participant updates
      socket.on('participant:update', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo && meetings.has(userInfo.meetingId)) {
          const meeting = meetings.get(userInfo.meetingId);
          const participant = meeting.participants.get(userInfo.participantId);
          if (participant) {
            if (data.isMuted !== undefined) participant.isMuted = data.isMuted;
            if (data.isVideoOff !== undefined) participant.isVideoOff = data.isVideoOff;

            socket.to(userInfo.meetingId).emit('participant:updated', {
              participantId: userInfo.participantId,
              isMuted: participant.isMuted,
              isVideoOff: participant.isVideoOff
            });
          }
        }
      });

      // Chat messages
      socket.on('chat:message', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo && meetings.has(userInfo.meetingId)) {
          const meeting = meetings.get(userInfo.meetingId);
          const message = {
            id: Date.now().toString(),
            senderId: userInfo.participantId,
            sender: userInfo.name,
            text: data.text,
            timestamp: new Date().toISOString(),
            isOwn: false
          };

          meeting.chatMessages.push(message);
          io.to(userInfo.meetingId).emit('chat:new-message', message);
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          console.log(`👋 ${userInfo.name} disconnected`);

          if (meetings.has(userInfo.meetingId)) {
            const meeting = meetings.get(userInfo.meetingId);
            meeting.participants.delete(userInfo.participantId);

            socket.to(userInfo.meetingId).emit('meeting:participant-left', {
              participantId: userInfo.participantId,
              reason: 'disconnected'
            });

            if (meeting.participants.size === 0) {
              setTimeout(() => {
                if (meetings.has(userInfo.meetingId) && 
                    meetings.get(userInfo.meetingId).participants.size === 0) {
                  meetings.delete(userInfo.meetingId);
                }
              }, 300000);
            }
          }

          connectedUsers.delete(socket.id);
        }
      });
    });
  }

  // Handle Socket.IO engine requests
  if (req.url && req.url.includes('/socket.io/')) {
    try {
      await new Promise((resolve, reject) => {
        io.engine.handleRequest(req, res);
        res.on('finish', resolve);
        res.on('error', reject);
      });
      return;
    } catch (error) {
      console.error('Socket.IO error:', error);
    }
  }

  // Health check response
  res.status(200).json({
    message: 'Socket.IO server running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      connectedClients: io ? io.sockets.sockets.size : 0,
      activeMeetings: meetings.size,
      totalUsers: connectedUsers.size
    }
  });
};