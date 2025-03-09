const { signup, login, logout } = require('../services/authService');
const { validateSignup, validateLogin } = require('../utils/validators');

const signupController = async (req, res) => {
  const { error } = validateSignup(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const user = await signup(req.body);
    res.status(201).send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const loginController = async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const { user, token } = await login(req.body.email, req.body.password);
    res.send({ user, token });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const logoutController = async (req, res) => {
  try {
    await logout(req.user);
    res.send({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports = { signupController, loginController, logoutController };
