import Submission from '../models/Submission.js';
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import cloudinary from 'cloudinary';

// @desc    Get a specific submission by ID
// @route   GET /api/submissions/:id
// @access  Private (Teacher of the course or the student who submitted)
export const getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name email profilePicture')
      .populate({
        path: 'assignment',
        select: 'title description deadline totalPoints course',
        populate: {
          path: 'course',
          select: 'name code teacher'
        }
      });
    
    if (!submission) {
      return next(new ApiError('Submission not found', 404));
    }
    
    // Check if user is the student who submitted or the teacher of the course
    const isStudent = submission.student._id.toString() === req.user.id;
    const isTeacher = submission.assignment.course.teacher.toString() === req.user.id;
    
    if (!isStudent && !isTeacher) {
      return next(new ApiError('Not authorized to view this submission', 403));
    }
    
    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all submissions for a specific student
// @route   GET /api/submissions/student/:studentId
// @access  Private (Teacher of the course or the student themselves)
export const getStudentSubmissions = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    // If not requesting own submissions, check if user is a teacher
    if (studentId !== req.user.id) {
      // Find courses taught by this teacher
      const teacherCourses = await Course.find({ teacher: req.user.id });
      if (teacherCourses.length === 0) {
        return next(new ApiError('Not authorized to view these submissions', 403));
      }
      
      // Get course IDs
      const courseIds = teacherCourses.map(course => course._id);
      
      // Find assignments for these courses
      const assignmentIds = (await Assignment.find({ course: { $in: courseIds } }))
        .map(assignment => assignment._id);
      
      // Get submissions for these assignments by the student
      const submissions = await Submission.find({
        assignment: { $in: assignmentIds },
        student: studentId
      })
        .populate('student', 'name email profilePicture')
        .populate({
          path: 'assignment',
          select: 'title description deadline totalPoints course',
          populate: {
            path: 'course',
            select: 'name code'
          }
        })
        .sort({ submittedAt: -1 });
      
      return res.status(200).json({
        success: true,
        count: submissions.length,
        data: submissions
      });
    }
    
    // If requesting own submissions
    const submissions = await Submission.find({ student: studentId })
      .populate({
        path: 'assignment',
        select: 'title description deadline totalPoints course',
        populate: {
          path: 'course',
          select: 'name code'
        }
      })
      .sort({ submittedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a submission
// @route   DELETE /api/submissions/:id
// @access  Private (Student who submitted or Teacher of the course)
export const deleteSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate({
        path: 'assignment',
        select: 'course',
        populate: {
          path: 'course',
          select: 'teacher'
        }
      });
    
    if (!submission) {
      return next(new ApiError('Submission not found', 404));
    }
    
    // Check if user is the student who submitted or the teacher of the course
    const isStudent = submission.student.toString() === req.user.id;
    const isTeacher = submission.assignment.course.teacher.toString() === req.user.id;
    
    if (!isStudent && !isTeacher) {
      return next(new ApiError('Not authorized to delete this submission', 403));
    }
    
    // If student is trying to delete a graded submission, don't allow
    if (isStudent && submission.status === 'graded') {
      return next(new ApiError('Cannot delete a graded submission', 400));
    }
    
    // Delete files from Cloudinary
    for (const file of submission.files) {
      await cloudinary.v2.uploader.destroy(file.cloudinaryId);
    }
    
    // Delete the submission
    await submission.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download a submission file
// @route   GET /api/submissions/:id/files/:fileId
// @access  Private (Student who submitted or Teacher of the course)
export const getSubmissionFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    
    const submission = await Submission.findById(id)
      .populate({
        path: 'assignment',
        select: 'course',
        populate: {
          path: 'course',
          select: 'teacher'
        }
      });
    
    if (!submission) {
      return next(new ApiError('Submission not found', 404));
    }
    
    // Check if user is the student who submitted or the teacher of the course
    const isStudent = submission.student.toString() === req.user.id;
    const isTeacher = submission.assignment.course.teacher.toString() === req.user.id;
    
    if (!isStudent && !isTeacher) {
      return next(new ApiError('Not authorized to access this file', 403));
    }
    
    // Find the file
    const file = submission.files.find(f => f.cloudinaryId === fileId);
    if (!file) {
      return next(new ApiError('File not found', 404));
    }
    
    // Return file URL (for Cloudinary, we just redirect to the URL)
    res.status(200).json({
      success: true,
      data: {
        url: file.url,
        fileName: file.originalName
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get submission statistics for a course
// @route   GET /api/submissions/stats/course/:courseId
// @access  Private (Teacher of the course)
export const getCourseSubmissionStats = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists and user is the teacher
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ApiError('Course not found', 404));
    }
    
    if (course.teacher.toString() !== req.user.id) {
      return next(new ApiError('Not authorized to view stats for this course', 403));
    }
    
    // Get all assignments for the course
    const assignments = await Assignment.find({ course: courseId });
    
    // Get submission stats for each assignment
    const assignmentStats = await Promise.all(
      assignments.map(async (assignment) => {
        const totalSubmissions = await Submission.countDocuments({
          assignment: assignment._id
        });
        
        const gradedSubmissions = await Submission.countDocuments({
          assignment: assignment._id,
          status: 'graded'
        });
        
        const lateSubmissions = await Submission.countDocuments({
          assignment: assignment._id,
          isLate: true
        });
        
        // Get average grade for this assignment
        const gradeStats = await Submission.aggregate([
          {
            $match: {
              assignment: assignment._id,
              'grade.points': { $exists: true }
            }
          },
          {
            $group: {
              _id: null,
              averageGrade: { $avg: '$grade.points' },
              highestGrade: { $max: '$grade.points' },
              lowestGrade: { $min: '$grade.points' }
            }
          }
        ]);
        
        return {
          assignment: {
            _id: assignment._id,
            title: assignment.title,
            deadline: assignment.deadline,
            totalPoints: assignment.totalPoints
          },
          stats: {
            totalSubmissions,
            gradedSubmissions,
            pendingSubmissions: totalSubmissions - gradedSubmissions,
            lateSubmissions,
            gradeStats: gradeStats.length > 0 ? gradeStats[0] : {
              averageGrade: 0,
              highestGrade: 0,
              lowestGrade: 0
            }
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: assignmentStats
    });
  } catch (error) {
    next(error);
  }
}; 