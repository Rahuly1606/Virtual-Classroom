import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  getCurrentUser,
  changePassword,
  sendVerificationOTP,
  verifyEmail,
  sendVerificationOTPPublic,
  verifyEmailPublic,
  sendPasswordResetOTP,
  verifyOTPAndResetPassword
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { userValidationRules, validateRequest } from '../middleware/validator.js';
import upload from '../utils/fileUpload.js';
import { setUploadPath, setAllowedFileTypes } from '../utils/fileUpload.js';

const router = express.Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [student, teacher]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/register', userValidationRules.register, validateRequest, registerUser);

/**
 * @swagger
 * /api/users/send-otp:
 *   post:
 *     summary: Send OTP for email verification
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       401:
 *         description: Not authorized
 */
router.post('/send-otp', protect, sendVerificationOTP);

/**
 * @swagger
 * /api/users/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: The OTP received by email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       401:
 *         description: Not authorized
 */
router.post('/verify-email', protect, verifyEmail);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', userValidationRules.login, validateRequest, loginUser);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current logged-in user data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/me', protect, getCurrentUser);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/profile', protect, getUserProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               section:
 *                 type: string
 *               year:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorized
 */
router.put(
  '/profile',
  protect,
  setUploadPath('profiles'),
  setAllowedFileTypes(['image/jpeg', 'image/png']),
  upload.single('profilePicture'),
  userValidationRules.updateProfile,
  validateRequest,
  updateUserProfile
);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Old password is incorrect
 */
router.put(
  '/change-password',
  protect,
  userValidationRules.changePassword,
  validateRequest,
  changePassword
);

/**
 * @swagger
 * /api/users/password-reset/send-otp:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 */
router.post('/password-reset/send-otp', sendPasswordResetOTP);

/**
 * @swagger
 * /api/users/password-reset/verify:
 *   post:
 *     summary: Verify OTP and reset password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */
router.post('/password-reset/verify', verifyOTPAndResetPassword);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (can filter by role)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, teacher]
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', protect, getUserById);

// Public routes for email verification during registration
router.post('/send-otp-public', sendVerificationOTPPublic);
router.post('/verify-email-public', verifyEmailPublic);

export default router; 