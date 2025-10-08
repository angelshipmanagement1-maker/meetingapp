const { Server } = require('socket.io');

// In-memory storage for serverless environment
let io;
let meetings = new Map();
let connectedUsers = new Map();

module.exports = (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Initialize Socket.IO server if not already done
  if (!io) {
    console.log('Initializing Socket.IO server for Vercel...');

    // Create a mock HTTP server for Socket.IO
    const httpServer = {
      listen: () => {}, // No-op for serverless
      on: () => {}, // No-op
    };

    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('meeting:join', async (data) => {
        try {
          const { meetingId, displayName, isHost, participantId } = data;

          // Store user connection
          connectedUsers.set(socket.id, {
            participantId,
            meetingId,
            name: displayName,
            isHost
          });

          // Initialize meeting if it doesn't exist
          if (!meetings.has(meetingId)) {
            meetings.set(meetingId, {
              id: meetingId,
              hostId: isHost ? participantId : null,
              participants: new Map(),
              chatMessages: [],
              currentDateTime: new Date().toISOString(),
              datetimeVersion: 0,
              isActive: true,
              maxParticipants: 50
            });
          }

          const meeting = meetings.get(meetingId);

          // Add participant to meeting
          if (!meeting.participants.has(participantId)) {
            meeting.participants.set(participantId, {
              id: participantId,
              name: displayName,
              role: isHost ? 'host' : 'participant',
              socketId: socket.id,
              isMuted: false,
              isVideoOff: false,
              joinedAt: new Date().toISOString()
            });
          }

          // Send meeting joined confirmation
          socket.emit('meeting:joined', {
            participantId,
            participants: Array.from(meeting.participants.values()),
            currentDateTime: meeting.currentDateTime,
            datetimeVersion: meeting.datetimeVersion,
            chatMessages: meeting.chatMessages.slice(-20)
          });

          // Notify others
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

      // WebRTC signaling
      socket.on('webrtc:offer', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          const targetSocket = findParticipantSocket(userInfo.meetingId, data.to);
          if (targetSocket) {
            targetSocket.emit('webrtc:offer', { ...data, from: userInfo.participantId });
          }
        }
      });

      socket.on('webrtc:answer', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          const targetSocket = findParticipantSocket(userInfo.meetingId, data.to);
          if (targetSocket) {
            targetSocket.emit('webrtc:answer', { ...data, from: userInfo.participantId });
          }
        }
      });

      socket.on('webrtc:ice-candidate', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          const targetSocket = findParticipantSocket(userInfo.meetingId, data.to);
          if (targetSocket) {
            targetSocket.emit('webrtc:ice-candidate', { ...data, from: userInfo.participantId });
          }
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

      // DateTime updates
      socket.on('meeting:datetime:update', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo && userInfo.isHost && meetings.has(userInfo.meetingId)) {
          const meeting = meetings.get(userInfo.meetingId);
          meeting.currentDateTime = data.newDateTime;
          meeting.datetimeVersion = data.version;

          io.to(userInfo.meetingId).emit('meeting:datetime:changed', {
            newDateTime: data.newDateTime,
            version: data.version,
            changedBy: userInfo.name,
            changedAt: new Date().toISOString()
          });
        }
      });

      // Reactions
      socket.on('meeting:reaction', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          io.to(userInfo.meetingId).emit('meeting:reaction-received', {
            participantId: userInfo.participantId,
            participantName: userInfo.name,
            emoji: data.emoji,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Hand raise
      socket.on('meeting:hand-raise', (data) => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          socket.to(userInfo.meetingId).emit('meeting:hand-raise-updated', {
            participantId: userInfo.participantId,
            participantName: userInfo.name,
            isRaised: data.isRaised
          });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          console.log(`${userInfo.name} disconnected from meeting ${userInfo.meetingId}`);

          // Remove from meeting
          if (meetings.has(userInfo.meetingId)) {
            const meeting = meetings.get(userInfo.meetingId);
            meeting.participants.delete(userInfo.participantId);

            // Notify others
            socket.to(userInfo.meetingId).emit('meeting:participant-left', {
              participantId: userInfo.participantId,
              reason: 'disconnected'
            });

            // Clean up empty meetings after some time
            if (meeting.participants.size === 0) {
              setTimeout(() => {
                if (meetings.has(userInfo.meetingId) && meetings.get(userInfo.meetingId).participants.size === 0) {
                  meetings.delete(userInfo.meetingId);
                  console.log(`Cleaned up empty meeting ${userInfo.meetingId}`);
                }
              }, 300000); // 5 minutes
            }
          }

          connectedUsers.delete(socket.id);
        }
      });
    });

    console.log('Socket.IO server initialized for Vercel');
  }

  // Handle Socket.IO requests
  if (req.headers.upgrade === 'websocket') {
    // WebSocket upgrade - let Socket.IO handle it
    return;
  }

  // Handle polling requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).json({
    message: 'Socket.IO server running',
    timestamp: new Date().toISOString()
  });
};

function findParticipantSocket(meetingId, participantId) {
  for (const [socketId, userInfo] of connectedUsers.entries()) {
    if (userInfo.meetingId === meetingId && userInfo.participantId === participantId) {
      // In serverless environment, we can't directly access socket instances
      // This is a simplified version - in production you'd need a more robust solution
      return null;
    }
  }
  return null;
}