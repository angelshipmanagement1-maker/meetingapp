import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/meetings', (req, res) => {
  const { hostName } = req.body;
  const meetingId = Math.random().toString(36).substring(2, 10);
  
  const meeting = {
    id: meetingId,
    hostName,
    participants: new Map(),
    createdAt: new Date(),
    isActive: true
  };
  
  meetings.set(meetingId, meeting);
  
  res.json({
    meetingId,
    hostToken: `host_${meetingId}`,
    joinToken: `join_${meetingId}`,
    joinUrl: `http://localhost:5173/meeting?mid=${meetingId}&host=true`
  });
});

app.post('/api/meetings/join', (req, res) => {
  const { token, displayName } = req.body;
  const meetingId = token.replace('join_', '').replace('host_', '');
  
  const meeting = meetings.get(meetingId);
  if (!meeting || !meeting.isActive) {
    return res.status(404).json({ error: 'Meeting not found or inactive' });
  }
  
  const participantId = Math.random().toString(36).substring(2, 15);
  
  res.json({
    meetingId,
    participantId,
    participant: {
      id: participantId,
      displayName,
      role: token.startsWith('host_') ? 'host' : 'participant'
    }
  });
});

app.get('/api/meetings/:id', (req, res) => {
  const meeting = meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  
  res.json({
    id: meeting.id,
    hostName: meeting.hostName,
    participantCount: meeting.participants.size,
    isActive: meeting.isActive
  });
});

const meetings = new Map();
const participants = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('meeting:join', (data) => {
    const { meetingId, displayName, isHost, participantId } = data;
    
    const meeting = meetings.get(meetingId);
    if (!meeting || !meeting.isActive) {
      socket.emit('error', { message: 'Meeting not found or inactive' });
      return;
    }

    const participant = {
      id: participantId,
      socketId: socket.id,
      displayName,
      isHost,
      isMuted: false,
      isVideoOff: false,
      joinedAt: new Date()
    };

    meeting.participants.set(participantId, participant);
    participants.set(socket.id, { participantId, meetingId });
    
    socket.join(meetingId);

    // Send current participants to new user
    const currentParticipants = Array.from(meeting.participants.values()).map(p => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
      isMuted: p.isMuted,
      isVideoOff: p.isVideoOff
    }));
    
    socket.emit('meeting:joined', {
      participantId,
      participants: currentParticipants,
      currentDateTime: new Date().toISOString(),
      datetimeVersion: 1,
      chatMessages: []
    });

    // Notify others about new participant
    socket.to(meetingId).emit('meeting:participant-joined', {
      id: participant.id,
      displayName: participant.displayName,
      isHost: participant.isHost,
      isMuted: participant.isMuted,
      isVideoOff: participant.isVideoOff
    });
    
    console.log(`${displayName} joined meeting ${meetingId}`);
  });

  socket.on('webrtc:offer', (data) => {
    const { from, to, offer } = data;
    const targetParticipant = findParticipantSocket(to);
    if (targetParticipant) {
      io.to(targetParticipant).emit('webrtc:offer', { from, to, offer });
    }
  });

  socket.on('webrtc:answer', (data) => {
    const { from, to, answer } = data;
    const targetParticipant = findParticipantSocket(to);
    if (targetParticipant) {
      io.to(targetParticipant).emit('webrtc:answer', { from, to, answer });
    }
  });

  socket.on('webrtc:ice-candidate', (data) => {
    const { from, to, candidate } = data;
    const targetParticipant = findParticipantSocket(to);
    if (targetParticipant) {
      io.to(targetParticipant).emit('webrtc:ice-candidate', { from, to, candidate });
    }
  });

  socket.on('chat:message', (data) => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { meetingId } = participantData;
      const meeting = meetings.get(meetingId);
      const participant = meeting?.participants.get(participantData.participantId);
      
      const message = {
        id: Date.now().toString(),
        text: data.text,
        sender: participant?.displayName || 'Unknown',
        timestamp: new Date().toISOString()
      };
      
      io.to(meetingId).emit('chat:new-message', message);
    }
  });

  socket.on('participant:update', (data) => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { meetingId, participantId } = participantData;
      const meeting = meetings.get(meetingId);
      const participant = meeting?.participants.get(participantId);
      
      if (participant) {
        if (data.isMuted !== undefined) participant.isMuted = data.isMuted;
        if (data.isVideoOff !== undefined) participant.isVideoOff = data.isVideoOff;
        
        socket.to(meetingId).emit('participant:updated', {
          participantId,
          isMuted: participant.isMuted,
          isVideoOff: participant.isVideoOff
        });
      }
    }
  });

  socket.on('disconnect', () => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { meetingId, participantId } = participantData;
      const meeting = meetings.get(meetingId);
      
      if (meeting) {
        meeting.participants.delete(participantId);
        socket.to(meetingId).emit('meeting:participant-left', {
          participantId,
          reason: 'disconnected'
        });
        
        if (meeting.participants.size === 0) {
          meetings.delete(meetingId);
        }
      }
      
      participants.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

function findParticipantSocket(participantId) {
  for (const [socketId, data] of participants.entries()) {
    if (data.participantId === participantId) {
      return socketId;
    }
  }
  return null;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});