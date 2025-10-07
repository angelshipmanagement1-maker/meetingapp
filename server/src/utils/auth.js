const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('./logger');

class AuthService {
  generateMeetingId() {
    return uuidv4();
  }

  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, { 
      expiresIn: config.jwt.expiresIn 
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  generateJoinToken(meetingId, role = 'participant', maxUses = 1) {
    const tokenId = uuidv4();
    const payload = {
      tokenId,
      meetingId,
      role,
      maxUses,
      usedCount: 0,
      createdAt: new Date().toISOString()
    };
    
    return {
      token: tokenId,
      payload
    };
  }

  generateHostToken(meetingId, hostId) {
    const tokenId = uuidv4();
    const payload = {
      tokenId,
      meetingId,
      hostId,
      role: 'host',
      createdAt: new Date().toISOString()
    };
    
    return {
      token: tokenId,
      payload
    };
  }

  createSecureLink(meetingId, token, baseUrl = 'http://localhost:5173') {
    return `${baseUrl}/join?mid=${meetingId}&tkn=${token}`;
  }

  extractTokenFromRequest(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return req.query.token || req.body.token;
  }
}

module.exports = new AuthService();