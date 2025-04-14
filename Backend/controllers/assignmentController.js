import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * @desc    Create a new assignment
 * @route   POST /api/assignments
 * @access  Private/Teacher
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { title, course, description, dueDate, totalPoints } = req.body;

    // Check if course exists and user is the teacher
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      throw new ApiError('Course not found', 404);
    }

    // Check if the user is the teacher of this course
    if (courseDoc.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to create assignments for this course', 403);
    }

    // Process uploaded files if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push(`/uploads/assignments/${file.filename}`);
      });
    }

    // Create the assignment
    const assignment = await Assignment.create({
      title,
      course,
      description,
      dueDate,
      totalPoints: totalPoints || 100,
      attachments,
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
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
      .sort({ dueDate: 1 });

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
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'teacher');

    if (!assignment) {
      throw new ApiError('Assignment not found', 404);
    }

    // Check if the user is the teacher of the course
    if (assignment.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to update this assignment', 403);
    }

    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => 
        `/uploads/assignments/${file.filename}`
      );
      
      // Add to existing attachments
      req.body.attachments = [...assignment.attachments, ...newAttachments];
    }

    // Update assignment
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedAssignment,
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
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'teacher');

    if (!assignment) {
      throw new ApiError('Assignment not found', 404);
    }

    // Check if the user is the teacher of the course
    if (assignment.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to delete this assignment', 403);
    }

    // Delete the assignment
    await assignment.deleteOne();

    // Delete all submissions for this assignment
    await Submission.deleteMany({ assignment: req.params.id });

    res.status(200).json({
      success: true,
      data: {},
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
    const assignment = await Assignment.findById(req.params.id)
      .populate('course');

    if (!assignment) {
      throw new ApiError('Assignment not found', 404);
    }

    // Check if student is enrolled in the course
    const isEnrolled = await Enrollment.exists({
      course: assignment.course._id,
      student: req.user._id,
      status: 'active',
    });

    if (!isEnrolled) {
      throw new ApiError('Not enrolled in this course', 403);
    }

    // Check if the assignment due date has passed
    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);

    // Check if a submission already exists
    let submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    // Process uploaded file
    let fileUrl = '';
    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }
    
    fileUrl = `/uploads/submissions/${req.file.filename}`;

    if (submission) {
      // Update existing submission
      submission.fileUrl = fileUrl;
      submission.comment = req.body.comment || '';
      submission.submissionDate = now;
      submission.status = isLate ? 'late' : 'pending';
      
      if (submission.status === 'graded') {
        submission.status = 'resubmitted';
      }
      
      await submission.save();
    } else {
      // Create new submission
      submission = await Submission.create({
        assignment: assignment._id,
        student: req.user._id,
        fileUrl,
        comment: req.body.comment || '',
        submissionDate: now,
        status: isLate ? 'late' : 'pending',
      });
    }

    res.status(201).json({
      success: true,
      data: submission,
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