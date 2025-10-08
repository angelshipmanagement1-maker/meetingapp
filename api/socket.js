// Basic HTTP-based real-time solution for Vercel
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

module.exports = (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle Socket.IO polling requests
    if (req.url && req.url.includes('/socket.io/')) {
      // Return a basic Socket.IO-like response
      res.status(200).json({
        sid: 'mock-session-id',
        upgrades: [],
        pingInterval: 25000,
        pingTimeout: 20000
      });
      return;
    }

    // Basic health check
    res.status(200).json({
      status: 'healthy',
      message: 'Real-time server running',
      timestamp: new Date().toISOString(),
      stats: { users: users.size, meetings: meetings.size }
    });

  } catch (error) {
    console.error('Socket error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};