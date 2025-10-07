const { v4: uuidv4 } = require('uuid');
const redisService = require('../utils/redis');
const config = require('../config');
const logger = require('../utils/logger');

// In-memory storage fallback when Redis is not available
const inMemoryStorage = new Map();

class Meeting {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.hostId = data.hostId;
    this.hostName = data.hostName;
    this.hostToken = data.hostToken;
    this.participants = new Map(data.participants || []);
    this.joinTokens = new Map(data.joinTokens || []);
    this.currentDateTime = data.currentDateTime || new Date().toISOString();
    this.datetimeVersion = data.datetimeVersion || 0;
    this.maxParticipants = data.maxParticipants || config.meeting.maxParticipants;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.chatMessages = data.chatMessages || [];
  }

  static getRedisKey(meetingId) {
    return `meeting:${meetingId}`;
  }

  static getTokenKey(token) {
    return `token:${token}`;
  }

  static getParticipantKey(meetingId, participantId) {
    return `participant:${meetingId}:${participantId}`;
  }

  async save() {
    try {
      const data = {
        id: this.id,
        hostId: this.hostId,
        hostName: this.hostName,
        hostToken: this.hostToken,
        participants: Array.from(this.participants.entries()),
        joinTokens: Array.from(this.joinTokens.entries()),
        currentDateTime: this.currentDateTime,
        datetimeVersion: this.datetimeVersion,
        maxParticipants: this.maxParticipants,
        createdAt: this.createdAt,
        isActive: this.isActive,
        chatMessages: this.chatMessages
      };

      // Try Redis first, fallback to in-memory
      if (redisService.isConnected) {
        const expirySeconds = config.meeting.expiryHours * 3600;
        await redisService.set(Meeting.getRedisKey(this.id), data, expirySeconds);
        logger.info(`Meeting ${this.id} saved to Redis`);
      } else {
        inMemoryStorage.set(Meeting.getRedisKey(this.id), data);
        logger.info(`Meeting ${this.id} saved to memory`);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to save meeting:', error);
      return false;
    }
  }

  static async findById(meetingId) {
    try {
      let data;
      
      // Try Redis first, fallback to in-memory
      if (redisService.isConnected) {
        data = await redisService.get(Meeting.getRedisKey(meetingId));
      } else {
        data = inMemoryStorage.get(Meeting.getRedisKey(meetingId));
      }
      
      if (!data) return null;
      
      return new Meeting(data);
    } catch (error) {
      logger.error('Failed to find meeting:', error);
      return null;
    }
  }

  static async create(hostData) {
    const meeting = new Meeting({
      id: hostData.id, // Allow custom ID
      hostId: hostData.hostId,
      hostName: hostData.hostName,
      hostToken: hostData.hostToken,
      maxParticipants: hostData.maxParticipants
    });

    const saved = await meeting.save();
    return saved ? meeting : null;
  }

  async addParticipant(participant) {
    if (this.participants.size >= this.maxParticipants) {
      throw new Error('Meeting is full');
    }

    this.participants.set(participant.id, {
      id: participant.id,
      name: participant.name,
      role: participant.role || 'participant',
      joinedAt: new Date().toISOString(),
      isHost: participant.role === 'host',
      isMuted: false,
      isVideoOff: false,
      socketId: participant.socketId
    });

    await this.save();
    logger.info(`Participant ${participant.name} added to meeting ${this.id}`);
  }

  async removeParticipant(participantId) {
    const participant = this.participants.get(participantId);
    if (participant) {
      this.participants.delete(participantId);
      await this.save();
      logger.info(`Participant ${participant.name} removed from meeting ${this.id}`);
      return participant;
    }
    return null;
  }

  async addJoinToken(tokenData) {
    this.joinTokens.set(tokenData.token, {
      ...tokenData.payload,
      createdAt: new Date().toISOString()
    });

    // Store token separately for quick lookup
    const tokenInfo = {
      meetingId: this.id,
      ...tokenData.payload
    };
    
    if (redisService.isConnected) {
      const expirySeconds = config.meeting.tokenExpiryHours * 3600;
      await redisService.set(Meeting.getTokenKey(tokenData.token), tokenInfo, expirySeconds);
    } else {
      inMemoryStorage.set(Meeting.getTokenKey(tokenData.token), tokenInfo);
    }

    await this.save();
    return tokenData.token;
  }

  static async validateToken(token) {
    try {
      let tokenData;
      
      // Try Redis first, fallback to in-memory
      if (redisService.isConnected) {
        tokenData = await redisService.get(Meeting.getTokenKey(token));
      } else {
        tokenData = inMemoryStorage.get(Meeting.getTokenKey(token));
      }
      
      if (!tokenData) return null;

      const meeting = await Meeting.findById(tokenData.meetingId);
      if (!meeting || !meeting.isActive) return null;

      const tokenInfo = meeting.joinTokens.get(token);
      if (!tokenInfo) return null;

      // Check if token has exceeded max uses
      if (tokenInfo.usedCount >= tokenInfo.maxUses) {
        return null;
      }

      return { meeting, tokenInfo };
    } catch (error) {
      logger.error('Token validation failed:', error);
      return null;
    }
  }

  async useToken(token) {
    const tokenInfo = this.joinTokens.get(token);
    if (tokenInfo) {
      tokenInfo.usedCount = (tokenInfo.usedCount || 0) + 1;
      tokenInfo.lastUsedAt = new Date().toISOString();
      this.joinTokens.set(token, tokenInfo);
      await this.save();
    }
  }

  async updateDateTime(newDateTime, changedBy) {
    this.currentDateTime = newDateTime;
    this.datetimeVersion += 1;
    
    await this.save();
    
    logger.info(`DateTime updated in meeting ${this.id} by ${changedBy}`);
    return {
      newDateTime: this.currentDateTime,
      version: this.datetimeVersion,
      changedBy
    };
  }

  async addChatMessage(message) {
    const chatMessage = {
      id: uuidv4(),
      senderId: message.senderId,
      sender: message.sender,
      text: message.text,
      timestamp: new Date().toISOString()
    };

    this.chatMessages.push(chatMessage);
    
    // Keep only last 100 messages
    if (this.chatMessages.length > 100) {
      this.chatMessages = this.chatMessages.slice(-100);
    }

    await this.save();
    return chatMessage;
  }

  getParticipantsList() {
    return Array.from(this.participants.values());
  }

  isHost(participantId) {
    const participant = this.participants.get(participantId);
    return participant && participant.role === 'host';
  }

  async terminate() {
    this.isActive = false;
    await this.save();
    
    // Clean up tokens
    for (const token of this.joinTokens.keys()) {
      if (redisService.isConnected) {
        await redisService.del(Meeting.getTokenKey(token));
      } else {
        inMemoryStorage.delete(Meeting.getTokenKey(token));
      }
    }
    
    logger.info(`Meeting ${this.id} terminated`);
  }

  toJSON() {
    return {
      id: this.id,
      hostName: this.hostName,
      currentDateTime: this.currentDateTime,
      datetimeVersion: this.datetimeVersion,
      maxParticipants: this.maxParticipants,
      participantCount: this.participants.size,
      createdAt: this.createdAt,
      isActive: this.isActive
    };
  }
}

module.exports = Meeting;