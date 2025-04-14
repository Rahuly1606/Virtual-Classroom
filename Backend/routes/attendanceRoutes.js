import express from 'express';
import {
  markAttendance,
  markBulkAttendance,
  getSessionAttendance,
  getStudentCourseAttendance,
  getCourseAttendanceStats,
  updateAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { attendanceValidationRules, validateRequest } from '../middleware/validator.js';

const router = express.Router();

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Mark attendance for a student
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session
 *               - student
 *               - status
 *             properties:
 *               session:
 *                 type: string
 *               student:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, excused]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized
 */
router.post(
  '/',
  protect,
  authorize('teacher'),
  attendanceValidationRules.create,
  validateRequest,
  markAttendance
);

/**
 * @swagger
 * /api/attendance/bulk:
 *   post:
 *     summary: Mark attendance for multiple students at once
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session
 *               - attendanceRecords
 *             properties:
 *               session:
 *                 type: string
 *               attendanceRecords:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - student
 *                     - status
 *                   properties:
 *                     student:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [present, absent, late, excused]
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk attendance marked successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized
 */
router.post('/bulk', protect, authorize('teacher'), markBulkAttendance);

/**
 * @swagger
 * /api/attendance/session/{sessionId}:
 *   get:
 *     summary: Get attendance records for a session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attendance records
 *       404:
 *         description: Session not found
 *       403:
 *         description: Not authorized
 */
router.get('/session/:sessionId', protect, getSessionAttendance);

/**
 * @swagger
 * /api/attendance/student/{studentId}/course/{courseId}:
 *   get:
 *     summary: Get attendance for a student in a course
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of student's attendance records
 *       404:
 *         description: Student or course not found
 *       403:
 *         description: Not authorized
 */
router.get('/student/:studentId/course/:courseId', protect, getStudentCourseAttendance);

/**
 * @swagger
 * /api/attendance/stats/course/{courseId}:
 *   get:
 *     summary: Get attendance statistics for a course
 *     tags: [Attendance]
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
 *         description: Attendance statistics
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not authorized
 */
router.get('/stats/course/:courseId', protect, authorize('teacher'), getCourseAttendanceStats);

/**
 * @swagger
 * /api/attendance/{id}:
 *   put:
 *     summary: Update an attendance record
 *     tags: [Attendance]
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
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, excused]
 *               notes:
 *                 type: string
 *               joinTime:
 *                 type: string
 *                 format: date-time
 *               leaveTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Attendance record updated successfully
 *       404:
 *         description: Attendance record not found
 *       403:
 *         description: Not authorized
 */
router.put(
  '/:id',
  protect,
  authorize('teacher'),
  attendanceValidationRules.update,
  validateRequest,
  updateAttendance
);

export default router; 