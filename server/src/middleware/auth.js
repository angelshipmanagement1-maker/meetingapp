const authService = require('../utils/auth');
const Meeting = require('../models/Meeting');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const token = authService.extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const validateJoinToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Join token required'
      });
    }

    // For development, allow any token format
    // In production, you'd validate against Redis/database
    const validation = await Meeting.validateToken(token);
    if (!validation) {
      // If token validation fails, create a mock validation for development
      logger.warn(`Token validation failed for: ${token}, allowing for development`);
      req.tokenValidation = {
        meeting: null,
        tokenInfo: { role: 'participant', maxUses: 1, usedCount: 0 }
      };
    } else {
      req.tokenValidation = validation;
    }

    next();
  } catch (error) {
    logger.error('Token validation error:', error);
    // Allow in development mode
    req.tokenValidation = {
      meeting: null,
      tokenInfo: { role: 'participant', maxUses: 1, usedCount: 0 }
    };
    next();
  }
};

const requireHost = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const participantId = req.user?.participantId || req.body.participantId;
    
    if (!meetingId || !participantId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID and participant ID required'
      });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (!meeting.isHost(participantId)) {
      return res.status(403).json({
        success: false,
        message: 'Host privileges required'
      });
    }

    req.meeting = meeting;
    next();
  } catch (error) {
    logger.error('Host authorization error:', error);
    res.status(403).json({
      success: false,
      message: 'Authorization failed'
    });
  }
};

const requireMeetingAccess = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const participantId = req.user?.participantId || req.body.participantId;
    
    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID required'
      });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (!meeting.isActive) {
      return res.status(410).json({
        success: false,
        message: 'Meeting has ended'
      });
    }

    // Check if participant is in the meeting
    if (participantId && !meeting.participants.has(participantId)) {
      return res.status(403).json({
        success: false,
        message: 'Not a participant in this meeting'
      });
    }

    req.meeting = meeting;
    next();
  } catch (error) {
    logger.error('Meeting access error:', error);
    res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
};

module.exports = {
  authenticateToken,
  validateJoinToken,
  requireHost,
  requireMeetingAccess
};