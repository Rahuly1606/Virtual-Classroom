import Session from '../models/Session.js';
import Course from '../models/Course.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createVideoSession } from '../utils/jitsiIntegration.js';

/**
 * @desc    Create a new session
 * @route   POST /api/sessions
 * @access  Private/Teacher
 */
export const createSession = async (req, res, next) => {
  try {
    const { title, course, description, startTime, endTime } = req.body;

    // Check if course exists and user is the teacher
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      throw new ApiError('Course not found', 404);
    }

    // Check if the user is the teacher of this course
    if (courseDoc.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to create sessions for this course', 403);
    }

    // Generate video conferencing link
    const videoSessionData = createVideoSession(req.user, courseDoc, title);

    // Create the session
    const session = await Session.create({
      title,
      course,
      description,
      startTime,
      endTime,
      videoLink: videoSessionData.videoLink,
      meetingId: videoSessionData.meetingId,
    });

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all sessions for a course
 * @route   GET /api/sessions/course/:courseId
 * @access  Private
 */
export const getSessionsByCourse = async (req, res, next) => {
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
      throw new ApiError('Not authorized to access sessions for this course', 403);
    }

    // Get sessions sorted by start time
    const sessions = await Session.find({ course: courseId })
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get upcoming sessions for the logged-in user (student or teacher)
 * @route   GET /api/sessions/upcoming
 * @access  Private
 */
export const getUpcomingSessions = async (req, res, next) => {
  try {
    const now = new Date();
    let query = {};

    if (req.user.role === 'teacher') {
      // For teachers, get courses they teach
      const courses = await Course.find({ teacher: req.user._id }).select('_id');
      const courseIds = courses.map(course => course._id);

      // Get upcoming sessions for these courses
      query = {
        course: { $in: courseIds },
        startTime: { $gt: now },
        isCompleted: false,
      };
    } else {
      // For students, get courses they are enrolled in
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: 'active',
      });
      const courseIds = enrollments.map(enrollment => enrollment.course);

      // Get upcoming sessions for these courses
      query = {
        course: { $in: courseIds },
        startTime: { $gt: now },
        isCompleted: false,
      };
    }

    // Get sessions and populate course info
    const sessions = await Session.find(query)
      .populate('course', 'title')
      .sort({ startTime: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a session by ID
 * @route   GET /api/sessions/:id
 * @access  Private
 */
export const getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course', 'title teacher');

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Check if user has access to this session
    const course = await Course.findById(session.course._id);

    // Teachers can access if they own the course
    const isTeacher = req.user.role === 'teacher' && 
      course.teacher.toString() === req.user._id.toString();

    // Students can access if they are enrolled
    let isStudent = false;
    if (req.user.role === 'student') {
      const isEnrolled = await Enrollment.exists({
        course: session.course._id,
        student: req.user._id,
        status: 'active',
      });
      isStudent = !!isEnrolled;
    }

    if (!isTeacher && !isStudent) {
      throw new ApiError('Not authorized to access this session', 403);
    }

    res.status(200).json({
      success: true,
      data: {
        ...session.toObject(),
        isTeacher,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a session
 * @route   PUT /api/sessions/:id
 * @access  Private/Teacher
 */
export const updateSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course', 'teacher');

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Check if the user is the teacher of the course
    if (session.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to update this session', 403);
    }

    // Update session
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a session
 * @route   DELETE /api/sessions/:id
 * @access  Private/Teacher
 */
export const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course', 'teacher');

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Check if the user is the teacher of the course
    if (session.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to delete this session', 403);
    }

    // Delete the session
    await session.deleteOne();

    // Also delete related attendance records
    await Attendance.deleteMany({ session: req.params.id });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a session as completed
 * @route   PUT /api/sessions/:id/complete
 * @access  Private/Teacher
 */
export const completeSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course', 'teacher');

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Check if the user is the teacher of the course
    if (session.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to update this session', 403);
    }

    // Update session to mark as completed
    session.isCompleted = true;
    
    // Add recording URL if provided
    if (req.body.recordingUrl) {
      session.recordingUrl = req.body.recordingUrl;
    }

    await session.save();

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// Import these models for the specific methods that use them
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js'; 