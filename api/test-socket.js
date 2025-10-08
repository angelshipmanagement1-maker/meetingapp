// Simple test endpoint to verify Socket.IO is working
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { Server } = require('socket.io');
    
    res.status(200).json({
      status: 'Socket.IO module loaded successfully',
      timestamp: new Date().toISOString(),
      socketIOVersion: require('socket.io/package.json').version,
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load Socket.IO',
      message: error.message,
      stack: error.stack
    });
  }
};