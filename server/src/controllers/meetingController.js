const meetingService = require('../services/MeetingService');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class MeetingController {
  async createMeeting(req, res, next) {
    try {
      const { hostName, scheduledDateTime, maxParticipants } = req.body;
      
      const hostId = uuidv4();
      const result = await meetingService.createMeeting({
        hostId,
        hostName,
        scheduledDateTime,
        maxParticipants
      });

      logger.info(`Meeting created successfully: ${result.meetingId}`);

      res.status(201).json({
        success: true,
        message: 'Meeting created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async joinMeeting(req, res, next) {
    try {
      const { token, displayName } = req.body;
      
      const participantId = uuidv4();
      const result = await meetingService.joinMeeting(token, {
        participantId,
        displayName,
        socketId: null // Will be set when socket connects
      });

      res.json({
        success: true,
        message: 'Joined meeting successfully',
        data: {
          meetingId: result.meeting.id,
          participantId,
          participant: result.participant,
          participants: result.participants,
          meeting: result.meeting.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMeetingInfo(req, res, next) {
    try {
      const { meetingId } = req.params;
      
      const result = await meetingService.getMeetingInfo(meetingId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async generateJoinToken(req, res, next) {
    try {
      const { meetingId } = req.params;
      const { hostId, maxUses = 1 } = req.body;

      const result = await meetingService.generateJoinToken(meetingId, hostId, maxUses);

      res.json({
        success: true,
        message: 'Join token generated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDateTime(req, res, next) {
    try {
      const { meetingId } = req.params;
      const { participantId, newDateTime, version } = req.body;

      const result = await meetingService.updateDateTime(
        meetingId,
        participantId,
        newDateTime,
        version
      );

      res.json({
        success: true,
        message: 'Meeting date/time updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async kickParticipant(req, res, next) {
    try {
      const { meetingId } = req.params;
      const { hostId, participantId } = req.body;

      const result = await meetingService.kickParticipant(meetingId, hostId, participantId);

      res.json({
        success: true,
        message: 'Participant kicked successfully',
        data: { participant: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async terminateMeeting(req, res, next) {
    try {
      const { meetingId } = req.params;
      const { hostId } = req.body;

      await meetingService.terminateMeeting(meetingId, hostId);

      res.json({
        success: true,
        message: 'Meeting terminated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async leaveMeeting(req, res, next) {
    try {
      const { meetingId } = req.params;
      const { participantId } = req.body;

      const result = await meetingService.leaveMeeting(meetingId, participantId);

      res.json({
        success: true,
        message: 'Left meeting successfully',
        data: {
          participant: result.participant,
          meetingTerminated: !result.meeting.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MeetingController();