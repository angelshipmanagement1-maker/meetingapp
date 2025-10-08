// Simple realtime API for polling
const meetings = new Map();
const users = new Map();

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
      
      if (!meetingId) {
        return res.status(400).json({ error: 'Meeting ID required' });
      }

      // Return empty messages for now
      return res.status(200).json({
        messages: [],
        lastMessageId: null
      });
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