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
        return new Date(a.dueDate) - new Date(b.dueDate);
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

/**
 * @desc    Get all assignments created by the logged-in teacher
 * @route   GET /api/assignments/teacher
 * @access  Private/Teacher
 */
export const getTeacherAssignments = async (req, res, next) => {
  try {
    // Ensure the user is a teacher
    if (req.user.role !== 'teacher') {
      throw new ApiError('Route only accessible to teachers', 403);
    }

    // Find all courses taught by this teacher
    const courses = await Course.find({ teacher: req.user._id }).select('_id title');
    
    if (courses.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Extract course IDs
    const courseIds = courses.map(course => course._id);

    // Find all assignments for these courses
    const assignments = await Assignment.find({
      course: { $in: courseIds }
    }).populate('course', 'title code');

    // Get submission counts for each assignment
    const assignmentsWithStats = await Promise.all(assignments.map(async (assignment) => {
      const totalSubmissions = await Submission.countDocuments({
        assignment: assignment._id
      });
      
      const gradedSubmissions = await Submission.countDocuments({
        assignment: assignment._id,
        status: 'graded'
      });

      return {
        ...assignment.toObject(),
        stats: {
          totalSubmissions,
          gradedSubmissions,
          pendingGrading: totalSubmissions - gradedSubmissions
        }
      };
    }));

    // Sort assignments by due date
    const sortedAssignments = assignmentsWithStats.sort((a, b) => {
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    res.status(200).json({
      success: true,
      count: sortedAssignments.length,
      data: sortedAssignments
    });
  } catch (error) {
    console.error('Error in getTeacherAssignments:', error);
    next(error);
  }
}; 