const Joi = require('joi');

const schemas = {
  createMeeting: Joi.object({
    hostId: Joi.string().optional(),
    hostName: Joi.string().min(1).max(50).required(),
    maxParticipants: Joi.number().integer().min(2).max(50).optional()
  }),

  joinMeeting: Joi.object({
    token: Joi.string().min(1).required(),
    participantId: Joi.string().optional(),
    displayName: Joi.string().min(1).max(50).required()
  }),

  updateDateTime: Joi.object({
    newDateTime: Joi.date().iso().required(),
    version: Joi.number().integer().min(0).required()
  }),

  chatMessage: Joi.object({
    text: Joi.string().min(1).max(1000).required()
  }),

  participantAction: Joi.object({
    participantId: Joi.string().required()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  schemas,
  validate
};