import express from 'express';
import {
  createSession,
  getSessionsByCourse,
  getSessionById,
  updateSession,
  deleteSession,
  getUpcomingSessions,
  completeSession,
  getAllSessions,
  getPastSessions,
  joinSession,
  startSession,
  endSession,
  getSessionStatus
} from '../controllers/sessionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { sessionValidationRules, validateRequest } from '../middleware/validator.js';

const router = express.Router();

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - course
 *               - startTime
 *               - endTime
 *             properties:
 *               title:
 *                 type: string
 *               course:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized to create sessions for this course
 */
router.post(
  '/',
  protect,
  authorize('teacher'),
  sessionValidationRules.create,
  validateRequest,
  createSession
);

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all sessions for the logged-in user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all user's sessions
 */
router.get('/', protect, getAllSessions);

/**
 * @swagger
 * /api/sessions/past:
 *   get:
 *     summary: Get past sessions for the logged-in user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of past sessions
 */
router.get('/past', protect, getPastSessions);

/**
 * @swagger
 * /api/sessions/upcoming:
 *   get:
 *     summary: Get upcoming sessions for the logged-in user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming sessions
 */
router.get('/upcoming', protect, getUpcomingSessions);

/**
 * @swagger
 * /api/sessions/course/{courseId}:
 *   get:
 *     summary: Get all sessions for a course
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sessions for the course
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not authorized to access sessions for this course
 */
router.get('/course/:courseId', protect, getSessionsByCourse);

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get a session by ID
 *     tags: [Sessions]
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
 *         description: Session details
 *       404:
 *         description: Session not found
 *       403:
 *         description: Not authorized to access this session
 */
router.get('/:id', protect, getSessionById);

/**
 * @swagger
 * /api/sessions/{id}:
 *   put:
 *     summary: Update a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Session updated successfully
 *       404:
 *         description: Session not found
 *       403:
 *         description: Not authorized to update this session
 */
router.put(
  '/:id',
  protect,
  authorize('teacher'),
  sessionValidationRules.update,
  validateRequest,
  updateSession
);

/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a session
 *     tags: [Sessions]
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
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       403:
 *         description: Not authorized to delete this session
 */
router.delete('/:id', protect, authorize('teacher'), deleteSession);

/**
 * @swagger
 * /api/sessions/{id}/complete:
 *   put:
 *     summary: Mark a session as completed
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recordingUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session marked as completed
 *       404:
 *         description: Session not found
 *       403:
 *         description: Not authorized to update this session
 */
router.put('/:id/complete', protect, authorize('teacher'), completeSession);

/**
 * @swagger
 * /api/sessions/{id}/start:
 *   post:
 *     summary: Start a live session (teacher only)
 *     tags: [Sessions]
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
 *         description: Session started successfully with auth token
 *       404:
 *         description: Session not found
 *       403:
 *         description: Not authorized to start this session
 */
router.post('/:id/start', protect, authorize('teacher'), startSession);

/**
 * @swagger
 * /api/sessions/{id}/end:
 *   post:
 *     summary: End a live session (teacher only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recordingUrl:
 *                 type: string
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Session ended successfully
 *       404:
 *         description: Session not found
 *       403:
 *         description: Not authorized to end this session
 */
router.post('/:id/end', protect, authorize('teacher'), endSession);

/**
 * @swagger
 * /api/sessions/{id}/status:
 *   get:
 *     summary: Get the current status of a session
 *     tags: [Sessions]
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
 *         description: Session status details
 *       404:
 *         description: Session not found
 */
router.get('/:id/status', protect, getSessionStatus);

/**
 * @swagger
 * /api/sessions/{id}/join:
 *   post:
 *     summary: Join a live session
 *     tags: [Sessions]
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
 *         description: Session join details with auth token
 *       404:
 *         description: Session not found
 *       403:
 *         description: Not authorized to join this session
 */
router.post('/:id/join', protect, joinSession);

export default router; 