// HTTP polling-based real-time communication
const { v4: uuidv4 } = require('uuid');

const meetings = new Map();
const users = new Map();
const messageQueues = new Map();

const CORS_ORIGINS = [
  'https://www.meetingapp.org',
  'https://meetingapp.org',
  'http://localhost:5173',
  'http://localhost:8080'
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function addMessage(meetingId, message) {
  if (!messageQueues.has(meetingId)) {
    messageQueues.set(meetingId, []);
  }
  messageQueues.get(meetingId).push({
    ...message,
    id: uuidv4(),
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 100 messages
  const queue = messageQueues.get(meetingId);
  if (queue.length > 100) {
    messageQueues.set(meetingId, queue.slice(-100));
  }
}

module.exports = (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, url } = req;
    const urlParts = url.split('/').filter(Boolean);

    // POST /api/realtime/join - Join meeting
    if (method === 'POST' && urlParts[2] === 'join') {
      const { meetingId, displayName, isHost, participantId } = req.body || {};
      
      if (!meetingId || !displayName || !participantId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

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
        isMuted: false,
        isVideoOff: false,
        joinedAt: new Date().toISOString()
      });

      users.set(participantId, { meetingId, name: displayName, isHost });

      // Notify other participants
      addMessage(meetingId, {
        type: 'participant-joined',
        data: {
          id: participantId,
          name: displayName,
          isHost,
          isMuted: false,
          isVideoOff: false,
          joinedAt: new Date().toISOString()
        }
      });

      return res.status(200).json({
        participantId,
        participants: Array.from(meeting.participants.values()),
        currentDateTime: meeting.currentDateTime,
        datetimeVersion: meeting.datetimeVersion,
        chatMessages: meeting.chatMessages.slice(-20)
      });
    }

    // GET /api/realtime/poll/:meetingId - Poll for updates
    if (method === 'GET' && urlParts[2] === 'poll') {
      const meetingId = urlParts[3];
      const lastMessageId = req.query?.lastMessageId;
      
      if (!meetingId) {
        return res.status(400).json({ error: 'Meeting ID required' });
      }

      const messages = messageQueues.get(meetingId) || [];
      let newMessages = messages;
      
      if (lastMessageId) {
        const lastIndex = messages.findIndex(m => m.id === lastMessageId);
        newMessages = lastIndex >= 0 ? messages.slice(lastIndex + 1) : messages;
      }

      return res.status(200).json({
        messages: newMessages,
        lastMessageId: messages.length > 0 ? messages[messages.length - 1].id : null
      });
    }

    // POST /api/realtime/message - Send message
    if (method === 'POST' && urlParts[2] === 'message') {
      const { meetingId, participantId, type, data } = req.body || {};
      
      if (!meetingId || !participantId || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = users.get(participantId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      addMessage(meetingId, { type, data: { ...data, from: participantId, fromName: user.name } });

      return res.status(200).json({ success: true });
    }

    // POST /api/realtime/chat - Send chat message
    if (method === 'POST' && urlParts[2] === 'chat') {
      const { meetingId, participantId, text } = req.body || {};
      
      if (!meetingId || !participantId || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = users.get(participantId);
      if (!user || !meetings.has(meetingId)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const message = {
        id: uuidv4(),
        senderId: participantId,
        sender: user.name,
        text,
        timestamp: new Date().toISOString(),
        isOwn: false
      };

      meetings.get(meetingId).chatMessages.push(message);
      addMessage(meetingId, { type: 'chat-message', data: message });

      return res.status(200).json({ success: true });
    }

    // Health check
    if (method === 'GET' && urlParts.length === 2) {
      return res.status(200).json({
        status: 'healthy',
        message: 'Realtime API running',
        timestamp: new Date().toISOString(),
        stats: { meetings: meetings.size, users: users.size }
      });
    }

    res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('Realtime API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};