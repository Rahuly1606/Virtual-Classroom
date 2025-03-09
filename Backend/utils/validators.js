const { signupSchema, loginSchema } = require('../schemas/authSchema');

const validateSignup = (data) => {
  return signupSchema.validate(data);
};

const validateLogin = (data) => {
  return loginSchema.validate(data);
};

module.exports = { validateSignup, validateLogin };
