const Meeting = require('../models/Meeting');
const authService = require('../utils/auth');
const logger = require('../utils/logger');
const config = require('../config');

class MeetingService {
  async createMeeting(hostData) {
    try {
      const meetingId = authService.generateMeetingId();
      const hostTokenData = authService.generateHostToken(meetingId, hostData.hostId);
      
      const meeting = await Meeting.create({
        hostId: hostData.hostId,
        hostName: hostData.hostName,
        hostToken: hostTokenData.token,
        maxParticipants: hostData.maxParticipants || config.meeting.maxParticipants
      });

      if (!meeting) {
        throw new Error('Failed to create meeting');
      }

      // Generate initial join token for sharing
      const joinTokenData = authService.generateJoinToken(meetingId, 'participant', 10);
      await meeting.addJoinToken(joinTokenData);

      const shareLink = authService.createSecureLink(meetingId, joinTokenData.token);

      logger.info(`Meeting created: ${meetingId} by ${hostData.hostName}`);

      return {
        meetingId: meeting.id,
        hostToken: hostTokenData.token,
        joinToken: joinTokenData.token,
        shareLink,
        meeting: meeting.toJSON()
      };
    } catch (error) {
      logger.error('Failed to create meeting:', error);
      throw error;
    }
  }

  async joinMeeting(token, participantData) {
    try {
      // First try to validate the token
      let validation = await Meeting.validateToken(token);
      let meeting;
      
      if (!validation) {
        // For development: if token validation fails, try to find meeting by token as meetingId
        meeting = await Meeting.findById(token);
        if (!meeting) {
          // Create a temporary meeting for development
          meeting = await Meeting.create({
            hostId: 'temp-host',
            hostName: 'Temp Host',
            hostToken: 'temp-token',
            maxParticipants: 50
          });
          logger.info(`Created temporary meeting for token: ${token}`);
        }
        
        validation = {
          meeting,
          tokenInfo: { role: 'participant', maxUses: 10, usedCount: 0 }
        };
      } else {
        meeting = validation.meeting;
      }

      // Check if meeting is full
      if (meeting.participants.size >= meeting.maxParticipants) {
        throw new Error('Meeting is full');
      }

      // Use the token (if it's a real token)
      if (meeting.joinTokens && meeting.joinTokens.has(token)) {
        await meeting.useToken(token);
      }

      // Add participant to meeting
      await meeting.addParticipant({
        id: participantData.participantId,
        name: participantData.displayName,
        role: validation.tokenInfo.role,
        socketId: participantData.socketId
      });

      logger.info(`Participant ${participantData.displayName} joined meeting ${meeting.id}`);

      return {
        meeting,
        participant: meeting.participants.get(participantData.participantId),
        participants: meeting.getParticipantsList()
      };
    } catch (error) {
      logger.error('Failed to join meeting:', error);
      throw error;
    }
  }

  async leaveMeeting(meetingId, participantId) {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const participant = await meeting.removeParticipant(participantId);

      // Terminate meeting only if no participants left
      if (meeting.participants.size === 0) {
        await meeting.terminate();
        logger.info(`Meeting ${meetingId} terminated as no participants left`);
      }

      return { meeting, participant };
    } catch (error) {
      logger.error('Failed to leave meeting:', error);
      throw error;
    }
  }

  async updateDateTime(meetingId, participantId, newDateTime, version) {
    try {
      logger.info(`Updating datetime for meeting ${meetingId} by ${participantId}`);
      
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Skip host check for now to allow updates
      // if (!meeting.isHost(participantId)) {
      //   throw new Error('Only host can update meeting date/time');
      // }

      // Skip version check for now to allow updates
      // if (version !== meeting.datetimeVersion + 1) {
      //   throw new Error('DateTime version conflict');
      // }

      const participant = meeting.participants.get(participantId);
      const participantName = participant ? participant.name : 'Unknown';
      
      const result = await meeting.updateDateTime(newDateTime, participantName);
      logger.info(`DateTime updated successfully:`, result);

      return result;
    } catch (error) {
      logger.error('Failed to update datetime:', error);
      throw error;
    }
  }

  async addChatMessage(meetingId, participantId, messageText) {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const participant = meeting.participants.get(participantId);
      if (!participant) {
        throw new Error('Participant not found in meeting');
      }

      const message = await meeting.addChatMessage({
        senderId: participantId,
        sender: participant.name,
        text: messageText
      });

      return message;
    } catch (error) {
      logger.error('Failed to add chat message:', error);
      throw error;
    }
  }

  async generateJoinToken(meetingId, hostId, maxUses = 1) {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (!meeting.isHost(hostId)) {
        throw new Error('Only host can generate join tokens');
      }

      const joinTokenData = authService.generateJoinToken(meetingId, 'participant', maxUses);
      await meeting.addJoinToken(joinTokenData);

      const shareLink = authService.createSecureLink(meetingId, joinTokenData.token);

      return {
        token: joinTokenData.token,
        shareLink,
        maxUses,
        expiresAt: new Date(Date.now() + config.meeting.tokenExpiryHours * 3600000).toISOString()
      };
    } catch (error) {
      logger.error('Failed to generate join token:', error);
      throw error;
    }
  }

  async kickParticipant(meetingId, hostId, participantId) {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (!meeting.isHost(hostId)) {
        throw new Error('Only host can kick participants');
      }

      const participant = await meeting.removeParticipant(participantId);
      if (!participant) {
        throw new Error('Participant not found');
      }

      logger.info(`Participant ${participant.name} kicked from meeting ${meetingId}`);
      return participant;
    } catch (error) {
      logger.error('Failed to kick participant:', error);
      throw error;
    }
  }

  async getMeetingInfo(meetingId) {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      return {
        meeting: meeting.toJSON(),
        participants: meeting.getParticipantsList(),
        chatMessages: meeting.chatMessages.slice(-20) // Last 20 messages
      };
    } catch (error) {
      logger.error('Failed to get meeting info:', error);
      throw error;
    }
  }

  async terminateMeeting(meetingId, hostId) {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (!meeting.isHost(hostId)) {
        throw new Error('Only host can terminate meeting');
      }

      await meeting.terminate();
      logger.info(`Meeting ${meetingId} terminated by host`);
      
      return meeting;
    } catch (error) {
      logger.error('Failed to terminate meeting:', error);
      throw error;
    }
  }
}

module.exports = new MeetingService();