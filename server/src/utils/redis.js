const { createClient } = require('redis');
const config = require('../config');
const logger = require('./logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    // Skip Redis connection if not configured or in development
    if (!config.redis?.url || config.nodeEnv === 'development') {
      logger.info('Redis disabled for development mode');
      return null;
    }

    try {
      this.client = createClient({
        url: config.redis.url,
        password: config.redis.password
      });

      this.client.on('error', (err) => {
        logger.warn('Redis Client Error (continuing without Redis):', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.warn('Redis unavailable, continuing without caching:', error.message);
      return null;
    }
  }

  async set(key, value, expireInSeconds = null) {
    if (!this.client || !this.isConnected) return false;
    
    try {
      const serializedValue = JSON.stringify(value);
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async get(key) {
    if (!this.client || !this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key) {
    if (!this.client || !this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.client || !this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async hSet(key, field, value) {
    if (!this.client || !this.isConnected) return false;
    
    try {
      await this.client.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis HSET error:', error);
      return false;
    }
  }

  async hGet(key, field) {
    if (!this.client || !this.isConnected) return null;
    
    try {
      const value = await this.client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis HGET error:', error);
      return null;
    }
  }

  async hGetAll(key) {
    if (!this.client || !this.isConnected) return {};
    
    try {
      const hash = await this.client.hGetAll(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error('Redis HGETALL error:', error);
      return {};
    }
  }

  async hDel(key, field) {
    if (!this.client || !this.isConnected) return false;
    
    try {
      await this.client.hDel(key, field);
      return true;
    } catch (error) {
      logger.error('Redis HDEL error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

module.exports = new RedisService();