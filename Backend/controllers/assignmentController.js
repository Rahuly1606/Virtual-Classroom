import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { ApiError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';

/**
 * @desc    Create a new assignment
 * @route   POST /api/assignments
 * @access  Private/Teacher
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { title, description, course, deadline, totalPoints } = req.body;
    
    // Check if course exists and user is the teacher
    const courseDoc = await Course.findById(course);
    
    if (!courseDoc) {
      return next(new ApiError('Course not found', 404));
    }
    
    if (courseDoc.teacher.toString() !== req.user.id) {
      return next(new ApiError('Not authorized to create assignments for this course', 403));
    }
    
    // Process uploaded files
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        files.push({
          originalName: file.originalname,
          fileName: file.filename,
          mimeType: file.mimetype,
          url: file.path,
          size: file.size,
          cloudinaryId: file.filename // For Cloudinary, the filename is the public_id
        });
      }
    }
    
    // Create the assignment
    const assignment = await Assignment.create({
      title,
      description,
      course,
      teacher: req.user.id,
      deadline: new Date(deadline),
      totalPoints: totalPoints || 100,
      files
    });
    
    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all assignments for the current student
 * @route   GET /api/assignments/student
 * @access  Private/Student
 */
export const getStudentAssignments = async (req, res, next) => {
  try {
    // Ensure the user is a student
    if (req.user.role !== 'student') {
      throw new ApiError('Route only accessible to students', 403);
    }

    // Find all active enrollments for this student
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: 'active'
    }).select('course');

    // Extract course IDs
    const courseIds = enrollments.map(enrollment => enrollment.course);

    if (courseIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Find all assignments for these courses
    const assignments = await Assignment.find({
      course: { $in: courseIds }
    }).populate('course', 'title code');

    // Check submission status for each assignment
    const assignmentsWithStatus = await Promise.all(assignments.map(async (assignment) => {
      const submission = await Submission.findOne({
        assignment: assignment._id,
        student: req.user._id
      });

      return {
        ...assignment.toObject(),
        submitted: !!submission,
        submission: submission ? {
          _id: submission._id,
          status: submission.status,
          grade: submission.grade,
          submissionDate: submission.submissionDate
        } : null
      };
    }));

    // Sort by due date (closest first)
    const sortedAssignments = assignmentsWithStatus.sort((a, b) => {
      // If not submitted, sort by due date
      if (!a.submitted && !b.submitted) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      // Submitted assignments go after non-submitted
      if (!a.submitted) return -1;
      if (!b.submitted) return 1;
      // If both submitted, sort by submission date (newest first)
      return new Date(b.submission.submissionDate) - new Date(a.submission.submissionDate);
    });

    res.status(200).json({
      success: true,
      count: sortedAssignments.length,
      data: sortedAssignments
    });
  } catch (error) {
    console.error('Error in getStudentAssignments:', error);
    next(error);
  }
};

/**
 * @desc    Get all assignments for a course
 * @route   GET /api/assignments/course/:courseId
 * @access  Private
 */
export const getCourseAssignments = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // For students, check if they are enrolled
    if (req.user.role === 'student') {
      const isEnrolled = await Enrollment.exists({
        course: courseId,
        student: req.user._id,
        status: 'active',
      });

      if (!isEnrolled) {
        throw new ApiError('Not enrolled in this course', 403);
      }
    }
    // For teachers, check if they teach this course
    else if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to access assignments for this course', 403);
    }

    // Get assignments
    const assignments = await Assignment.find({ course: courseId })
      .populate('teacher', 'name')
      .sort({ deadline: 1 });

    // For students, check if they have submitted each assignment
    if (req.user.role === 'student') {
      const assignmentsWithSubmissionStatus = await Promise.all(assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: req.user._id,
        });

        return {
          ...assignment.toObject(),
          submitted: !!submission,
          submission: submission ? {
            status: submission.status,
            grade: submission.grade,
            submissionDate: submission.submissionDate,
            _id: submission._id,
          } : null,
        };
      }));

      return res.status(200).json({
        success: true,
        count: assignmentsWithSubmissionStatus.length,
        data: assignmentsWithSubmissionStatus,
      });
    }

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get assignment by ID
 * @route   GET /api/assignments/:id
 * @access  Private
 */
export const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title teacher');

    if (!assignment) {
      throw new ApiError('Assignment not found', 404);
    }

    // Check if user has access to this assignment
    const course = await Course.findById(assignment.course._id);
    
    // Teachers can access if they own the course
    const isTeacher = req.user.role === 'teacher' && 
      course.teacher.toString() === req.user._id.toString();

    // Students can access if they are enrolled
    let isStudent = false;
    let submission = null;
    
    if (req.user.role === 'student') {
      const isEnrolled = await Enrollment.exists({
        course: assignment.course._id,
        student: req.user._id,
        status: 'active',
      });
      
      isStudent = !!isEnrolled;
      
      // Check if student has submitted this assignment
      if (isStudent) {
        submission = await Submission.findOne({
          assignment: assignment._id,
          student: req.user._id,
        });
      }
    }

    if (!isTeacher && !isStudent) {
      throw new ApiError('Not authorized to access this assignment', 403);
    }

    res.status(200).json({
      success: true,
      data: {
        ...assignment.toObject(),
        isTeacher,
        submission,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update assignment
 * @route   PUT /api/assignments/:id
 * @access  Private/Teacher
 */
export const updateAssignment = async (req, res, next) => {
  try {
    let assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return next(new ApiError('Assignment not found', 404));
    }
    
    // Check if user is the teacher who created the assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return next(new ApiError('Not authorized to update this assignment', 403));
    }
    
    const { title, description, deadline, totalPoints } = req.body;
    
    // Process uploaded files if any
    let files = [...assignment.files];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        files.push({
          originalName: file.originalname,
          fileName: file.filename,
          mimeType: file.mimetype,
          url: file.path,
          size: file.size,
          cloudinaryId: file.filename
        });
      }
    }
    
    // Update the assignment
    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        title: title || assignment.title,
        description: description || assignment.description,
        deadline: deadline ? new Date(deadline) : assignment.deadline,
        totalPoints: totalPoints || assignment.totalPoints,
        files,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete assignment
 * @route   DELETE /api/assignments/:id
 * @access  Private/Teacher
 */
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return next(new ApiError('Assignment not found', 404));
    }
    
    // Check if user is the teacher who created the assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return next(new ApiError('Not authorized to delete this assignment', 403));
    }
    
    // Delete files from Cloudinary
    for (const file of assignment.files) {
      await cloudinary.v2.uploader.destroy(file.cloudinaryId);
    }
    
    // Delete all submissions for this assignment
    await Submission.deleteMany({ assignment: assignment._id });
    
    // Delete the assignment
    await assignment.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit assignment (student)
 * @route   POST /api/assignments/:id/submit
 * @access  Private/Student
 */
export const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    // Check if assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return next(new ApiError('Assignment not found', 404));
    }
    
    // Check if student is enrolled in the course
    const course = await Course.findById(assignment.course);
    if (!course.students.includes(req.user.id)) {
      return next(new ApiError('Not enrolled in this course', 403));
    }
    
    // Check if deadline has passed
    const isLate = new Date() > new Date(assignment.deadline);
    
    // Process uploaded files
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        files.push({
          originalName: file.originalname,
          fileName: file.filename,
          mimeType: file.mimetype,
          url: file.path,
          size: file.size,
          cloudinaryId: file.filename
        });
      }
    } else {
      return next(new ApiError('Please upload at least one file', 400));
    }
    
    // Check if submission already exists
    let submission = await Submission.findOne({
      assignment: id,
      student: req.user.id
    });
    
    if (submission) {
      // If resubmitting, delete old files from Cloudinary
      for (const file of submission.files) {
        await cloudinary.v2.uploader.destroy(file.cloudinaryId);
      }
      
      // Update submission
      submission = await Submission.findByIdAndUpdate(
        submission._id,
        {
          files,
          comment: comment || submission.comment,
          submittedAt: Date.now(),
          status: 'submitted',
          isLate,
          // Remove grade if resubmitting
          $unset: { 'grade.points': '', 'grade.feedback': '', 'grade.gradedBy': '', 'grade.gradedAt': '' }
        },
        { new: true }
      );
    } else {
      // Create new submission
      submission = await Submission.create({
        assignment: id,
        student: req.user.id,
        files,
        comment,
        isLate
      });
    }
    
    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all submissions for an assignment
 * @route   GET /api/assignments/:id/submissions
 * @access  Private/Teacher
 */
export const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course');

    if (!assignment) {
      throw new ApiError('Assignment not found', 404);
    }

    // Check if the user is the teacher of the course
    if (assignment.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to view submissions for this assignment', 403);
    }

    // Get all submissions for this assignment
    const submissions = await Submission.find({ assignment: assignment._id })
      .populate('student', 'name email profilePicture')
      .sort({ submissionDate: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Grade a submission
 * @route   PUT /api/submissions/:id/grade
 * @access  Private/Teacher
 */
export const gradeSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate({
        path: 'assignment',
        populate: {
          path: 'course',
          select: 'teacher',
        },
      });

    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Check if the user is the teacher of the course
    if (submission.assignment.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to grade this submission', 403);
    }

    // Validate grade
    const { grade, feedback } = req.body;
    
    if (grade < 0 || grade > submission.assignment.totalPoints) {
      throw new ApiError(`Grade must be between 0 and ${submission.assignment.totalPoints}`, 400);
    }

    // Update submission
    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.status = 'graded';
    
    await submission.save();

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all assignments created by the logged-in teacher
 * @route   GET /api/assignments/teacher
 * @access  Private/Teacher
 */
export const getTeacherAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user.id })
      .populate('course', 'name code')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a file from an assignment
 * @route   DELETE /api/assignments/:id/files/:fileId
 * @access  Private (Teacher who created the assignment)
 */
export const deleteAssignmentFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    
    // Check if assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return next(new ApiError('Assignment not found', 404));
    }
    
    // Check if user is the teacher who created the assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return next(new ApiError('Not authorized to modify this assignment', 403));
    }
    
    // Find the file by cloudinaryId
    const fileIndex = assignment.files.findIndex(file => file.cloudinaryId === fileId);
    if (fileIndex === -1) {
      return next(new ApiError('File not found', 404));
    }
    
    // Delete file from Cloudinary
    await cloudinary.v2.uploader.destroy(assignment.files[fileIndex].cloudinaryId);
    
    // Remove file from assignment
    assignment.files.splice(fileIndex, 1);
    await assignment.save();
    
    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
}; 