const User = require('../models/User');
const bcrypt = require('bcrypt');
const { generateToken } = require('./tokenService');

const signup = async (userData) => {
  if (userData.role === 'Parent') {
    const student = await User.findOne({ email: userData.studentEmail, role: 'Student' });
    if (!student) {
      throw new Error('Student email does not exist');
    }
  }
  const user = new User({
    fullname: userData.fullname,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    ...(userData.role === 'Parent' && { studentEmail: userData.studentEmail }) // Conditionally include studentEmail
  });
  await user.save();
  return user;
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({ id: user._id, role: user.role });
  return { user, token };
};

const logout = async (user) => {
  // Implement any necessary logout logic, such as token invalidation
  // For simplicity, we'll assume the token is managed on the client side
  return;
};

module.exports = { signup, login, logout };
