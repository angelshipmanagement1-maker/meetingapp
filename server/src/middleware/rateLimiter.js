const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

// Disable rate limiting in development
const isDevelopment = config.nodeEnv === 'development';

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: isDevelopment ? 1000 : config.rateLimit.max, // High limit for dev
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip in development
});

// Lenient limiter for meeting creation in development
const createMeetingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5, // 100 meetings per 15 minutes in dev
  message: {
    success: false,
    message: 'Too many meetings created, please wait before creating another'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip in development
});

// Join meeting limiter
const joinMeetingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDevelopment ? 200 : 20, // 200 join attempts in dev
  message: {
    success: false,
    message: 'Too many join attempts, please wait'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip in development
});

// Chat message limiter
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 300 : 30, // 300 messages per minute in dev
  message: {
    success: false,
    message: 'Too many messages, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip in development
});

module.exports = {
  apiLimiter,
  createMeetingLimiter,
  joinMeetingLimiter,
  chatLimiter
};