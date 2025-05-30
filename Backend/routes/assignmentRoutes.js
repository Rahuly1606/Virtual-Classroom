import express from 'express';
import {
  createAssignment,
  getCourseAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getStudentAssignments,
  getTeacherAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  deleteAssignmentFile
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload, { setUploadPath } from '../utils/fileUpload.js';

const router = express.Router();

/**
 * @swagger
 * /api/assignments/student:
 *   get:
 *     summary: Get all assignments for the current student
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments for the student across all courses
 *       403:
 *         description: Not authorized (only students can access)
 */
router.get('/student', protect, authorize('student'), getStudentAssignments);

/**
 * @swagger
 * /api/assignments/teacher:
 *   get:
 *     summary: Get all assignments created by the current teacher
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments created by the teacher
 *       403:
 *         description: Not authorized (only teachers can access)
 */
router.get('/teacher', protect, authorize('teacher'), getTeacherAssignments);

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Create a new assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - course
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *               course:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               totalPoints:
 *                 type: number
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized to create assignments for this course
 */
router.post(
  '/',
  protect,
  authorize('teacher'),
  setUploadPath('assignments'),
  upload.array('files'),
  createAssignment
);

/**
 * @swagger
 * /api/assignments/course/{courseId}:
 *   get:
 *     summary: Get all assignments for a course
 *     tags: [Assignments]
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
 *         description: List of assignments for the course
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not authorized to access assignments for this course
 */
router.get('/course/:courseId', protect, getCourseAssignments);

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Get an assignment by ID
 *     tags: [Assignments]
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
 *         description: Assignment details
 *       404:
 *         description: Assignment not found
 *       403:
 *         description: Not authorized to access this assignment
 */
router.get('/:id', protect, getAssignmentById);

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: Update an assignment
 *     tags: [Assignments]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               totalPoints:
 *                 type: number
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       404:
 *         description: Assignment not found
 *       403:
 *         description: Not authorized to update this assignment
 */
router.put(
  '/:id',
  protect,
  authorize('teacher'),
  setUploadPath('assignments'),
  upload.array('files'),
  updateAssignment
);

/**
 * @swagger
 * /api/assignments/{id}:
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Assignments]
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
 *         description: Assignment deleted successfully
 *       404:
 *         description: Assignment not found
 *       403:
 *         description: Not authorized to delete this assignment
 */
router.delete('/:id', protect, authorize('teacher'), deleteAssignment);

/**
 * @swagger
 * /api/assignments/{id}/submit:
 *   post:
 *     summary: Submit an assignment (student)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Assignment submitted successfully
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: Assignment not found
 *       403:
 *         description: Not enrolled in this course
 */
router.post(
  '/:id/submit',
  protect,
  authorize('student'),
  setUploadPath('submissions'),
  upload.array('files'),
  submitAssignment
);

/**
 * @swagger
 * /api/assignments/{id}/submissions:
 *   get:
 *     summary: Get all submissions for an assignment
 *     tags: [Assignments]
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
 *         description: List of submissions
 *       404:
 *         description: Assignment not found
 *       403:
 *         description: Not authorized to view submissions for this assignment
 */
router.get('/:id/submissions', protect, authorize('teacher'), getAssignmentSubmissions);

/**
 * @swagger
 * /api/submissions/{id}/grade:
 *   put:
 *     summary: Grade a submission
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grade
 *             properties:
 *               grade:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Submission graded successfully
 *       400:
 *         description: Invalid grade
 *       404:
 *         description: Submission not found
 *       403:
 *         description: Not authorized to grade this submission
 */
router.post(
  '/submissions/:id/grade',
  protect,
  authorize('teacher'),
  gradeSubmission
);

router.delete('/:id/files/:fileId', protect, authorize('teacher'), deleteAssignmentFile);

export default router; 