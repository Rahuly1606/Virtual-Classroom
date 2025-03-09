const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwtConfig');

const generateToken = (payload) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };
