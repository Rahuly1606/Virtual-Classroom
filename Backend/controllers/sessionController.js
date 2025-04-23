import Session from '../models/Session.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createVideoSession } from '../utils/jitsiIntegration.js';

/**
 * @desc    Create a new session
 * @route   POST /api/sessions
 * @access  Private/Teacher
 */
export const createSession = async (req, res, next) => {
  try {
    const { title, course, description, startTime, endTime, videoProvider = 'jitsi' } = req.body;

    // Check if course exists and user is the teacher
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      throw new ApiError('Course not found', 404);
    }

    // Check if the user is the teacher of this course
    if (courseDoc.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to create sessions for this course', 403);
    }

    // Generate video conferencing data using Jitsi
    const videoSessionData = createVideoSession(req.user, courseDoc, title);

    // Create the session
    const session = await Session.create({
      title,
      course,
      description,
      startTime,
      endTime,
      videoLink: videoSessionData.videoLink,
      hostVideoLink: videoSessionData.videoLink, // Jitsi doesn't have separate host links
      meetingId: videoSessionData.meetingId,
      videoProvider: 'jitsi',
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

    // Return the appropriate video link based on user role
    // Teachers get the host link, students get the regular link
    const videoLink = isTeacher && session.hostVideoLink ? session.hostVideoLink : session.videoLink;

    res.status(200).json({
      success: true,
      data: {
        ...session.toObject(),
        videoLink,
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
      .populate('course', 'teacher title code');

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Check if the user is the teacher of the course
    if (session.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to update this session', 403);
    }
    
    // Handle dates properly to avoid validation errors
    const { startTime, endTime } = req.body;
    let startDate = session.startTime;
    let endDate = session.endTime;
    
    // Parse dates safely
    if (startTime) {
      startDate = new Date(startTime);
    }
    
    if (endTime) {
      endDate = new Date(endTime);
    }
    
    // Ensure end time is after start time
    if (startDate && endDate && startDate >= endDate) {
      // If end time is not after start time, set it to start time + 1 hour
      endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
      req.body.endTime = endDate;
      console.log(`Adjusted endTime to be 1 hour after startTime: ${endDate}`);
    }
    
    // Check if title has changed and we need to create a new video session
    const titleChanged = req.body.title && req.body.title !== session.title;
    
    let updatedVideoData = {};
    
    // If title has changed, regenerate video session link with Jitsi
    if (titleChanged) {
      try {
        console.log('Updating session video data due to title change');
        
        // Create a new Jitsi room with updated title
        const jitsiIntegration = await import('../utils/jitsiIntegration.js');
        const newVideoData = jitsiIntegration.createVideoSession(
          req.user, 
          session.course,
          req.body.title
        );
        
        updatedVideoData = {
          videoLink: newVideoData.videoLink,
          hostVideoLink: newVideoData.videoLink,
          meetingId: newVideoData.meetingId,
          videoProvider: 'jitsi'
        };
        
        console.log(`Created new Jitsi room for updated session: ${newVideoData.meetingId}`);
      } catch (error) {
        console.error('Error updating video session:', error);
        // Continue without updating video data if it fails
      }
    }

    // Update session with all changes, including any new video data
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      { 
        $set: {
          ...req.body,
          ...updatedVideoData
        } 
      },
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
    await Session.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Session deleted successfully',
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

/**
 * @desc    Get all sessions for the logged-in user
 * @route   GET /api/sessions
 * @access  Private
 */
export const getAllSessions = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      // For teachers, get courses they teach
      const courses = await Course.find({ teacher: req.user._id }).select('_id');
      const courseIds = courses.map(course => course._id);

      // Get sessions for these courses
      query = {
        course: { $in: courseIds },
      };
    } else {
      // For students, get courses they are enrolled in
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: 'active',
      });
      const courseIds = enrollments.map(enrollment => enrollment.course);

      // Get sessions for these courses
      query = {
        course: { $in: courseIds },
      };
    }

    // Get sessions and populate course info
    const sessions = await Session.find(query)
      .populate('course', 'title')
      .sort({ startTime: -1 });

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
 * @desc    Get past sessions for the logged-in user
 * @route   GET /api/sessions/past
 * @access  Private
 */
export const getPastSessions = async (req, res, next) => {
  try {
    const now = new Date();
    let query = {};

    if (req.user.role === 'teacher') {
      // For teachers, get courses they teach
      const courses = await Course.find({ teacher: req.user._id }).select('_id');
      const courseIds = courses.map(course => course._id);

      // Get past sessions for these courses
      query = {
        course: { $in: courseIds },
        endTime: { $lt: now },
      };
    } else {
      // For students, get courses they are enrolled in
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: 'active',
      });
      const courseIds = enrollments.map(enrollment => enrollment.course);

      // Get past sessions for these courses
      query = {
        course: { $in: courseIds },
        endTime: { $lt: now },
      };
    }

    // Get sessions and populate course info
    const sessions = await Session.find(query)
      .populate('course', 'title')
      .sort({ startTime: -1 })
      .limit(20);

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
 * @desc    Join a session (get access URL)
 * @route   POST /api/sessions/:id/join
 * @access  Private
 */
export const joinSession = async (req, res, next) => {
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
      throw new ApiError('Not authorized to join this session', 403);
    }
    
    // Check if the session is active or upcoming (within 10 minutes)
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    const joinBuffer = new Date(startTime);
    joinBuffer.setMinutes(joinBuffer.getMinutes() - 10);
    
    if (now < joinBuffer) {
      throw new ApiError('This session is not available to join yet. You can join 10 minutes before the start time.', 400);
    }
    
    if (now > endTime) {
      throw new ApiError('This session has already ended.', 400);
    }

    // Return the appropriate video link based on user role
    // Teachers get the host link, students get the regular link
    const videoLink = isTeacher && session.hostVideoLink ? session.hostVideoLink : session.videoLink;
    
    // If no video link is available, handle the error gracefully
    if (!videoLink) {
      console.error(`No video link available for session ${session._id}`);
      throw new ApiError('Video conference link is not available for this session', 500);
    }

    // Create attendance record for the student
    if (isStudent) {
      try {
        const Attendance = (await import('../models/Attendance.js')).default;
        await Attendance.findOneAndUpdate(
          { 
            session: session._id,
            student: req.user._id 
          },
          { 
            $setOnInsert: { 
              session: session._id,
              student: req.user._id,
              joinTime: new Date()
            }
          },
          { 
            upsert: true, 
            new: true 
          }
        );
        console.log(`Attendance recorded for student ${req.user._id} in session ${session._id}`);
      } catch (error) {
        console.error('Error recording attendance:', error);
        // Continue anyway to let the student join
      }
    }

    res.status(200).json({
      success: true,
      data: {
        videoLink,
        isTeacher,
        sessionId: session._id,
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime
      },
    });
  } catch (error) {
    next(error);
  }
};

// Import these models for the specific methods that use them
import Attendance from '../models/Attendance.js'; 