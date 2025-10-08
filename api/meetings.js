const { v4: uuidv4 } = require('uuid');

// In-memory storage (use Redis in production)
const meetings = new Map();
const tokens = new Map();

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

function generateToken() {
  return uuidv4().replace(/-/g, '');
}

function generateMeetingId() {
  return Math.random().toString(36).substring(2, 10);
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

    // POST /api/meetings - Create meeting
    if (method === 'POST' && urlParts.length === 2) {
      const { hostName, maxParticipants = 50 } = req.body || {};
      
      if (!hostName) {
        return res.status(400).json({ error: 'Host name is required' });
      }

      const meetingId = generateMeetingId();
      const hostToken = generateToken();
      const joinToken = generateToken();

      const meeting = {
        id: meetingId,
        hostName,
        maxParticipants,
        createdAt: new Date().toISOString(),
        participants: [],
        isActive: true
      };

      meetings.set(meetingId, meeting);
      tokens.set(hostToken, { meetingId, role: 'host', participantId: uuidv4() });
      tokens.set(joinToken, { meetingId, role: 'participant', maxUses: 10, uses: 0 });

      return res.status(201).json({
        meetingId,
        hostToken,
        joinToken,
        joinUrl: `https://www.meetingapp.org/meeting/${meetingId}?token=${joinToken}`,
        shareLink: `https://www.meetingapp.org/meeting/${meetingId}?token=${joinToken}`
      });
    }

    // POST /api/meetings/join - Join meeting
    if (method === 'POST' && urlParts[2] === 'join') {
      const { token, displayName } = req.body || {};
      
      if (!token || !displayName) {
        return res.status(400).json({ error: 'Token and display name are required' });
      }

      const tokenData = tokens.get(token);
      if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const meeting = meetings.get(tokenData.meetingId);
      if (!meeting || !meeting.isActive) {
        return res.status(404).json({ error: 'Meeting not found or ended' });
      }

      const participantId = tokenData.participantId || uuidv4();
      const participant = {
        id: participantId,
        name: displayName,
        role: tokenData.role,
        joinedAt: new Date().toISOString()
      };

      meeting.participants.push(participant);

      return res.status(200).json({
        meetingId: tokenData.meetingId,
        participantId,
        participant,
        participants: meeting.participants,
        meeting: { id: tokenData.meetingId }
      });
    }

    // GET /api/meetings/:id - Get meeting info
    if (method === 'GET' && urlParts.length === 3) {
      const meetingId = urlParts[2];
      const meeting = meetings.get(meetingId);
      
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      return res.status(200).json(meeting);
    }

    // Health check
    if (method === 'GET' && urlParts.length === 0) {
      return res.status(200).json({
        status: 'healthy',
        message: 'Meetings API running',
        timestamp: new Date().toISOString(),
        stats: { meetings: meetings.size, tokens: tokens.size }
      });
    }

    res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};