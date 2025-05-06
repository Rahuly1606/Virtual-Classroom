import express from 'express';
import {
  getSubmission,
  getStudentSubmissions,
  deleteSubmission,
  getSubmissionFile,
  getCourseSubmissionStats
} from '../controllers/submissionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get submission by ID
router.route('/:id')
  .get(protect, getSubmission)
  .delete(protect, deleteSubmission);

// Get all submissions for a student
router.route('/student/:studentId')
  .get(protect, getStudentSubmissions);

// Get a specific file from a submission
router.route('/:id/files/:fileId')
  .get(protect, getSubmissionFile);

// Get submission statistics for a course
router.route('/stats/course/:courseId')
  .get(protect, authorize('teacher'), getCourseSubmissionStats);

export default router; 