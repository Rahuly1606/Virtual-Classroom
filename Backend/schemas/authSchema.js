const Joi = require('joi');

const signupSchema = Joi.object({
  fullname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Student', 'Teacher', 'Admin', 'Parent').required(),
  studentEmail: Joi.when('role', {
    is: 'Parent',
    then: Joi.string().email().required(),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { signupSchema, loginSchema };
