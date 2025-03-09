const express = require('express');
const { signupController, loginController, logoutController } = require('../controller/authController');

const router = express.Router();

router.post('/signup', signupController);
router.post('/login', loginController);
router.post('/logout', logoutController);

module.exports = router;
