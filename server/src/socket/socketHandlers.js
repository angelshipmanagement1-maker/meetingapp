const meetingService = require('../services/MeetingService');
const Meeting = require('../models/Meeting');
const logger = require('../utils/logger');

class SocketHandlers {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // socketId -> { participantId, meetingId, name }
  }

  handleConnection(socket) {
    logger.info(`Socket connected: ${socket.id}`);

    // Handle meeting join via socket
    socket.on('meeting:join', async (data) => {
      try {
        await this.handleMeetingJoin(socket, data);
      } catch (error) {
        logger.error('Socket meeting join error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle datetime updates
    socket.on('meeting:datetime:update', async (data) => {
      try {
        await this.handleDateTimeUpdate(socket, data);
      } catch (error) {
        logger.error('Socket datetime update error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle chat messages
    socket.on('chat:message', async (data) => {
      try {
        await this.handleChatMessage(socket, data);
      } catch (error) {
        logger.error('Socket chat message error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // WebRTC signaling
    socket.on('webrtc:offer', (data) => {
      this.handleWebRTCSignal(socket, 'webrtc:offer', data);
    });

    socket.on('webrtc:answer', (data) => {
      this.handleWebRTCSignal(socket, 'webrtc:answer', data);
    });

    socket.on('webrtc:ice-candidate', (data) => {
      this.handleWebRTCSignal(socket, 'webrtc:ice-candidate', data);
    });

    // Handle participant actions (mute, video toggle, etc.)
    socket.on('participant:update', async (data) => {
      try {
        await this.handleParticipantUpdate(socket, data);
      } catch (error) {
        logger.error('Socket participant update error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle reactions
    socket.on('meeting:reaction', (data) => {
      this.handleReaction(socket, data);
    });

    // Handle hand raise
    socket.on('meeting:hand-raise', (data) => {
      this.handleHandRaise(socket, data);
    });

    // Handle host actions
    socket.on('host:kick-participant', async (data) => {
      try {
        await this.handleKickParticipant(socket, data);
      } catch (error) {
        logger.error('Socket kick participant error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      await this.handleDisconnect(socket);
    });
  }

  async handleMeetingJoin(socket, data) {
    const { meetingId, displayName, isHost, participantId } = data;

    // Find or create meeting - use meetingId as the actual ID
    let meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      // Auto-create meeting with the provided meetingId
      const meetingData = {
        id: meetingId, // Use the provided meetingId
        hostId: isHost ? participantId : 'temp-host',
        hostName: isHost ? displayName : 'Temp Host',
        hostToken: 'temp-token',
        maxParticipants: 50
      };
      meeting = new Meeting(meetingData);
      await meeting.save();
      logger.info(`Auto-created meeting ${meetingId} for ${displayName}`);
    }
    
    if (!meeting.isActive) {
      throw new Error('Meeting is inactive');
    }

    // Check if meeting is full
    if (meeting.participants.size >= meeting.maxParticipants) {
      throw new Error('Meeting is full');
    }

    // Add or update participant
    if (meeting.participants.has(participantId)) {
      const participant = meeting.participants.get(participantId);
      participant.socketId = socket.id;
      meeting.participants.set(participantId, participant);
      await meeting.save();
    } else {
      // Add new participant
      await meeting.addParticipant({
        id: participantId,
        name: displayName,
        role: isHost ? 'host' : 'participant',
        socketId: socket.id
      });
    }

    // Store connection info
    this.connectedUsers.set(socket.id, {
      participantId,
      meetingId,
      name: displayName,
      isHost
    });

    // Join socket room
    socket.join(meetingId);

    // Send current meeting state to joining participant
    socket.emit('meeting:joined', {
      participantId,
      participants: meeting.getParticipantsList(),
      currentDateTime: meeting.currentDateTime,
      datetimeVersion: meeting.datetimeVersion,
      chatMessages: meeting.chatMessages.slice(-20)
    });

    // Notify others about new participant
    socket.to(meetingId).emit('meeting:participant-joined', {
      id: participantId,
      name: displayName,
      isHost,
      isMuted: false,
      isVideoOff: false,
      joinedAt: new Date().toISOString()
    });

    // Send updated participant list to all participants
    this.io.to(meetingId).emit('meeting:participants-updated', {
      participants: meeting.getParticipantsList()
    });

    logger.info(`${displayName} joined meeting ${meetingId} via socket`);
  }

  async handleDateTimeUpdate(socket, data) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      throw new Error('User not connected to any meeting');
    }

    const { newDateTime, version } = data;
    
    const result = await meetingService.updateDateTime(
      userInfo.meetingId,
      userInfo.participantId,
      newDateTime,
      version
    );

    // Broadcast to all participants in the meeting
    this.io.to(userInfo.meetingId).emit('meeting:datetime:changed', {
      newDateTime: result.newDateTime,
      version: result.version,
      changedBy: result.changedBy,
      changedAt: new Date().toISOString()
    });

    logger.info(`DateTime updated in meeting ${userInfo.meetingId} by ${userInfo.name}`);
  }

  async handleChatMessage(socket, data) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      throw new Error('User not connected to any meeting');
    }

    const { text } = data;
    
    const message = await meetingService.addChatMessage(
      userInfo.meetingId,
      userInfo.participantId,
      text
    );

    // Broadcast message to all participants
    this.io.to(userInfo.meetingId).emit('chat:new-message', message);

    logger.info(`Chat message sent in meeting ${userInfo.meetingId} by ${userInfo.name}`);
  }

  handleWebRTCSignal(socket, eventType, data) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      socket.emit('error', { message: 'User not connected to any meeting' });
      return;
    }

    const { to } = data;
    
    // Find target participant's socket
    const targetSocket = this.findParticipantSocket(userInfo.meetingId, to);
    if (targetSocket) {
      targetSocket.emit(eventType, {
        ...data,
        from: userInfo.participantId
      });
    }
  }

  async handleParticipantUpdate(socket, data) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      throw new Error('User not connected to any meeting');
    }

    const { isMuted, isVideoOff } = data;

    // Update participant state in meeting
    const meeting = await Meeting.findById(userInfo.meetingId);
    if (meeting && meeting.participants.has(userInfo.participantId)) {
      const participant = meeting.participants.get(userInfo.participantId);
      if (isMuted !== undefined) participant.isMuted = isMuted;
      if (isVideoOff !== undefined) participant.isVideoOff = isVideoOff;
      
      meeting.participants.set(userInfo.participantId, participant);
      await meeting.save();

      // Broadcast update to other participants
      socket.to(userInfo.meetingId).emit('participant:updated', {
        participantId: userInfo.participantId,
        isMuted: participant.isMuted,
        isVideoOff: participant.isVideoOff
      });
    }
  }

  async handleKickParticipant(socket, data) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo || !userInfo.isHost) {
      throw new Error('Only host can kick participants');
    }

    const { participantId } = data;
    
    const participant = await meetingService.kickParticipant(
      userInfo.meetingId,
      userInfo.participantId,
      participantId
    );

    // Find and disconnect the kicked participant
    const targetSocket = this.findParticipantSocket(userInfo.meetingId, participantId);
    if (targetSocket) {
      targetSocket.emit('meeting:kicked', {
        message: 'You have been removed from the meeting'
      });
      targetSocket.leave(userInfo.meetingId);
      this.connectedUsers.delete(targetSocket.id);
    }

    // Notify other participants
    socket.to(userInfo.meetingId).emit('meeting:participant-left', {
      participantId,
      reason: 'kicked'
    });

    logger.info(`Participant ${participant.name} kicked from meeting ${userInfo.meetingId}`);
  }

  async handleDisconnect(socket) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (userInfo) {
      try {
        // Remove participant from meeting
        const result = await meetingService.leaveMeeting(
          userInfo.meetingId,
          userInfo.participantId
        );

        // Notify other participants
        socket.to(userInfo.meetingId).emit('meeting:participant-left', {
          participantId: userInfo.participantId,
          reason: 'disconnected'
        });

        // If meeting was terminated (no participants left), notify all participants
        if (!result.meeting.isActive) {
          this.io.to(userInfo.meetingId).emit('meeting:terminated', {
            message: 'Meeting has ended as all participants left'
          });
        }

        this.connectedUsers.delete(socket.id);
        logger.info(`${userInfo.name} disconnected from meeting ${userInfo.meetingId}`);
      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    }

    logger.info(`Socket disconnected: ${socket.id}`);
  }

  handleReaction(socket, data) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) return;

    const { emoji } = data;
    
    // Broadcast reaction to all participants in the meeting
    this.io.to(userInfo.meetingId).emit('meeting:reaction-received', {
      participantId: userInfo.participantId,
      participantName: userInfo.name,
      emoji,
      timestamp: new Date().toISOString()
    });

    logger.info(`Reaction ${emoji} sent by ${userInfo.name} in meeting ${userInfo.meetingId}`);
  }

  handleHandRaise(socket, data) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) return;

    const { isRaised } = data;
    
    // Broadcast hand raise status to all participants
    socket.to(userInfo.meetingId).emit('meeting:hand-raise-updated', {
      participantId: userInfo.participantId,
      participantName: userInfo.name,
      isRaised
    });

    logger.info(`Hand ${isRaised ? 'raised' : 'lowered'} by ${userInfo.name} in meeting ${userInfo.meetingId}`);
  }

  findParticipantSocket(meetingId, participantId) {
    for (const [socketId, userInfo] of this.connectedUsers.entries()) {
      if (userInfo.meetingId === meetingId && userInfo.participantId === participantId) {
        return this.io.sockets.sockets.get(socketId);
      }
    }
    return null;
  }

  // Get meeting statistics
  getMeetingStats(meetingId) {
    const participants = Array.from(this.connectedUsers.values())
      .filter(user => user.meetingId === meetingId);
    
    return {
      connectedParticipants: participants.length,
      participants: participants.map(p => ({
        participantId: p.participantId,
        name: p.name,
        isHost: p.isHost
      }))
    };
  }
}

module.exports = SocketHandlers;