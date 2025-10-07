const logger = require('../utils/logger');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.message = 'Validation error';
    error.details = err.message;
    return res.status(400).json(error);
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    return res.status(401).json(error);
  }

  if (err.message === 'Meeting not found') {
    error.message = err.message;
    return res.status(404).json(error);
  }

  if (err.message === 'Meeting is full') {
    error.message = err.message;
    return res.status(409).json(error);
  }

  if (err.message === 'Invalid or expired token') {
    error.message = err.message;
    return res.status(401).json(error);
  }

  if (err.message === 'Only host can update meeting date/time') {
    error.message = err.message;
    return res.status(403).json(error);
  }

  // Include error details in development
  if (config.nodeEnv === 'development') {
    error.details = err.message;
    error.stack = err.stack;
  }

  res.status(500).json(error);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};