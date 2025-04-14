import express from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  dropCourse,
  getCourseStudents,
  getTeacherCourses,
  getEnrolledCourses,
} from '../controllers/courseController.js';
import { protect, authorize } from '../middleware/auth.js';
import { courseValidationRules, validateRequest } from '../middleware/validator.js';
import upload from '../utils/fileUpload.js';
import { setUploadPath, setAllowedFileTypes } from '../utils/fileUpload.js';

const router = express.Router();

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               subject:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized to create courses
 */
router.post(
  '/',
  protect,
  authorize('teacher'),
  setUploadPath('courses'),
  setAllowedFileTypes(['image/jpeg', 'image/png']),
  upload.single('coverImage'),
  courseValidationRules.create,
  validateRequest,
  createCourse
);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses (with optional filters)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', protect, getCourses);

/**
 * @swagger
 * /api/courses/my-courses:
 *   get:
 *     summary: Get courses taught by the logged-in teacher
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teacher's courses
 *       403:
 *         description: Not authorized (not a teacher)
 */
router.get('/my-courses', protect, authorize('teacher'), getTeacherCourses);

/**
 * @swagger
 * /api/courses/enrolled:
 *   get:
 *     summary: Get courses in which the logged-in student is enrolled
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled courses
 *       403:
 *         description: Not authorized (not a student)
 */
router.get('/enrolled', protect, authorize('student'), getEnrolledCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
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
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', protect, getCourseById);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
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
 *               subject:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not authorized to update this course
 */
router.put(
  '/:id',
  protect,
  authorize('teacher'),
  setUploadPath('courses'),
  setAllowedFileTypes(['image/jpeg', 'image/png']),
  upload.single('coverImage'),
  courseValidationRules.update,
  validateRequest,
  updateCourse
);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
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
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not authorized to delete this course
 */
router.delete('/:id', protect, authorize('teacher'), deleteCourse);

/**
 * @swagger
 * /api/courses/{id}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *       400:
 *         description: Already enrolled
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not authorized (not a student)
 */
router.post('/:id/enroll', protect, authorize('student'), enrollInCourse);

/**
 * @swagger
 * /api/courses/{id}/drop:
 *   put:
 *     summary: Drop a course (unenroll)
 *     tags: [Courses]
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
 *         description: Dropped successfully
 *       404:
 *         description: Not enrolled in this course
 *       403:
 *         description: Not authorized (not a student)
 */
router.put('/:id/drop', protect, authorize('student'), dropCourse);

/**
 * @swagger
 * /api/courses/{id}/students:
 *   get:
 *     summary: Get all students enrolled in a course
 *     tags: [Courses]
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
 *         description: List of enrolled students
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not authorized to view course students
 */
router.get('/:id/students', protect, authorize('teacher'), getCourseStudents);

export default router; 