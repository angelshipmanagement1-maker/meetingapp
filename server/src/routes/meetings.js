const express = require('express');
const meetingController = require('../controllers/meetingController');
const { validate, schemas } = require('../utils/validation');
const { 
  createMeetingLimiter, 
  joinMeetingLimiter, 
  apiLimiter 
} = require('../middleware/rateLimiter');
const { 
  requireHost, 
  requireMeetingAccess, 
  validateJoinToken 
} = require('../middleware/auth');

const router = express.Router();

// Apply general rate limiting to all routes
router.use(apiLimiter);

// Create a new meeting
router.post('/create', 
  createMeetingLimiter,
  validate(schemas.createMeeting),
  meetingController.createMeeting
);

// Join a meeting with token
router.post('/join',
  joinMeetingLimiter,
  validate(schemas.joinMeeting),
  validateJoinToken,
  meetingController.joinMeeting
);

// Get meeting information
router.get('/:meetingId',
  requireMeetingAccess,
  meetingController.getMeetingInfo
);

// Generate new join token (host only)
router.post('/:meetingId/tokens',
  requireHost,
  meetingController.generateJoinToken
);

// Update meeting date/time (host only)
router.put('/:meetingId/datetime',
  validate(schemas.updateDateTime),
  requireHost,
  meetingController.updateDateTime
);

// Kick participant (host only)
router.post('/:meetingId/kick',
  validate(schemas.participantAction),
  requireHost,
  meetingController.kickParticipant
);

// Leave meeting
router.post('/:meetingId/leave',
  requireMeetingAccess,
  meetingController.leaveMeeting
);

// Terminate meeting (host only)
router.delete('/:meetingId',
  requireHost,
  meetingController.terminateMeeting
);

module.exports = router;