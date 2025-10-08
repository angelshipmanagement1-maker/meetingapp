const { Server } = require('socket.io');

// Global state
let io;
const meetings = new Map();
const users = new Map();

const CORS_ORIGINS = [
  'https://www.meetingapp.org',
  'https://meetingapp.org',
  'http://localhost:5173',
  'http://localhost:8080'
];

module.exports = (req, res) => {
  try {
    // Set CORS headers
    const origin = req.headers.origin;
    if (CORS_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Initialize Socket.IO server
    if (!io) {
      io = new Server({
        cors: {
          origin: CORS_ORIGINS,
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['polling'],
        allowEIO3: true
      });

      io.on('connection', (socket) => {
        // Join meeting
        socket.on('meeting:join', (data) => {
          try {
            const { meetingId, displayName, isHost, participantId } = data;
            
            users.set(socket.id, { participantId, meetingId, name: displayName, isHost });
            
            if (!meetings.has(meetingId)) {
              meetings.set(meetingId, {
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

            socket.join(meetingId);

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
          } catch (error) {
            console.error('Join error:', error);
          }
        });

        // WebRTC signaling
        socket.on('webrtc:offer', (data) => {
          const user = users.get(socket.id);
          if (user) {
            socket.to(user.meetingId).emit('webrtc:offer', { ...data, from: user.participantId });
          }
        });

        socket.on('webrtc:answer', (data) => {
          const user = users.get(socket.id);
          if (user) {
            socket.to(user.meetingId).emit('webrtc:answer', { ...data, from: user.participantId });
          }
        });

        socket.on('webrtc:ice-candidate', (data) => {
          const user = users.get(socket.id);
          if (user) {
            socket.to(user.meetingId).emit('webrtc:ice-candidate', { ...data, from: user.participantId });
          }
        });

        // Chat
        socket.on('chat:message', (data) => {
          const user = users.get(socket.id);
          if (user && meetings.has(user.meetingId)) {
            const message = {
              id: Date.now().toString(),
              senderId: user.participantId,
              sender: user.name,
              text: data.text,
              timestamp: new Date().toISOString(),
              isOwn: false
            };
            meetings.get(user.meetingId).chatMessages.push(message);
            io.to(user.meetingId).emit('chat:new-message', message);
          }
        });

        // Reactions
        socket.on('meeting:reaction', (data) => {
          const user = users.get(socket.id);
          if (user) {
            io.to(user.meetingId).emit('meeting:reaction-received', {
              participantId: user.participantId,
              participantName: user.name,
              emoji: data.emoji,
              timestamp: new Date().toISOString()
            });
          }
        });

        // Hand raise
        socket.on('meeting:hand-raise', (data) => {
          const user = users.get(socket.id);
          if (user) {
            socket.to(user.meetingId).emit('meeting:hand-raise-updated', {
              participantId: user.participantId,
              participantName: user.name,
              isRaised: data.isRaised
            });
          }
        });

        // DateTime updates
        socket.on('meeting:datetime:update', (data) => {
          const user = users.get(socket.id);
          if (user && user.isHost && meetings.has(user.meetingId)) {
            const meeting = meetings.get(user.meetingId);
            meeting.currentDateTime = data.newDateTime;
            meeting.datetimeVersion = data.version;
            io.to(user.meetingId).emit('meeting:datetime:changed', {
              newDateTime: data.newDateTime,
              version: data.version,
              changedBy: user.name,
              changedAt: new Date().toISOString()
            });
          }
        });

        // Participant updates
        socket.on('participant:update', (data) => {
          const user = users.get(socket.id);
          if (user && meetings.has(user.meetingId)) {
            const participant = meetings.get(user.meetingId).participants.get(user.participantId);
            if (participant) {
              if (data.isMuted !== undefined) participant.isMuted = data.isMuted;
              if (data.isVideoOff !== undefined) participant.isVideoOff = data.isVideoOff;
              socket.to(user.meetingId).emit('participant:updated', {
                participantId: user.participantId,
                isMuted: participant.isMuted,
                isVideoOff: participant.isVideoOff
              });
            }
          }
        });

        // Disconnect
        socket.on('disconnect', () => {
          const user = users.get(socket.id);
          if (user && meetings.has(user.meetingId)) {
            meetings.get(user.meetingId).participants.delete(user.participantId);
            socket.to(user.meetingId).emit('meeting:participant-left', {
              participantId: user.participantId,
              reason: 'disconnected'
            });
          }
          users.delete(socket.id);
        });
      });
    }

    // Handle Socket.IO requests
    if (req.url && req.url.includes('/socket.io/')) {
      io.engine.handleRequest(req, res);
      return;
    }

    // Health check
    res.status(200).json({
      status: 'healthy',
      message: 'Socket.IO server running',
      timestamp: new Date().toISOString(),
      stats: { users: users.size, meetings: meetings.size }
    });

  } catch (error) {
    console.error('Socket.IO error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};