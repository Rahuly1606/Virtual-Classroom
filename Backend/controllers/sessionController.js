import Session from '../models/Session.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { ApiError } from '../middleware/errorHandler.js';
import * as jitsiIntegration from '../utils/jitsiIntegration.js';
import * as attendanceTracker from '../utils/attendanceTracker.js';
import Attendance from '../models/Attendance.js';

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

    let videoSessionData = {};

    // Generate video conferencing data based on provider
    if (videoProvider === 'jitsi' || videoProvider === 'other') {
      videoSessionData = jitsiIntegration.createVideoSession(req.user, courseDoc, title);
    }

    // Create the session
    const session = await Session.create({
      title,
      course,
      description,
      startTime,
      endTime,
      videoLink: videoSessionData.videoLink || '',
      hostVideoLink: videoSessionData.hostVideoLink || '',
      meetingId: videoSessionData.meetingId || '',
      videoProvider,
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
        
        // Create a safe course object to pass to the video session creator
        const courseData = {
          _id: session.course._id,
          title: session.course.title || 'Course',
          code: session.course.code || ''
        };
        
        // Create a new Jitsi room with updated title
        const newVideoData = jitsiIntegration.createVideoSession(
          req.user, 
          courseData,
          req.body.title
        );
        
        if (newVideoData && newVideoData.videoLink) {
          updatedVideoData = {
            videoLink: newVideoData.videoLink,
            hostVideoLink: newVideoData.hostVideoLink,
            meetingId: newVideoData.meetingId || '',
            videoProvider: 'jitsi'
          };
          
          console.log(`Created new Jitsi room for updated session: ${newVideoData.meetingId}`);
        } else {
          console.warn('Video data creation returned incomplete data');
        }
      } catch (error) {
        console.error('Error updating video session:', error);
        // Continue without updating video data if it fails
      }
    }

    // Prepare data for update
    const updateData = { ...req.body };
    
    // Only include video data if it was successfully generated
    if (updatedVideoData.videoLink) {
      Object.assign(updateData, updatedVideoData);
    }

    // Update session with all changes
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    console.error('Session update error:', error);
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
 * @desc    Start a live session
 * @route   POST /api/sessions/:id/start
 * @access  Private/Teacher
 */
export const startSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course', 'teacher title');

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Check if the user is the teacher of the course
    if (session.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to start this session', 403);
    }

    // Generate tokens and video data
    let tokenData = {};

    // Generate tokens based on video provider
    if (session.videoProvider === 'jitsi' || session.videoProvider === 'other') {
      tokenData = jitsiIntegration.generateJitsiData(req.user, session);
      
      // Log the token data for debugging
      console.log('Generated Jitsi data:', JSON.stringify(tokenData));
    }

    // Check if session is already active
    if (session.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Session is already active',
        data: {
          sessionId: session._id,
          videoLink: tokenData.videoLink || session.hostVideoLink || session.videoLink,
          videoProvider: session.videoProvider,
          meetingId: tokenData.meetingId || session.meetingId
        },
      });
    }

    // If the session didn't have video information, update it with the new data
    let updated = false;
    if (tokenData.videoLink && (!session.videoLink || !session.meetingId)) {
      session.videoLink = tokenData.videoLink;
      session.hostVideoLink = tokenData.hostVideoLink || tokenData.videoLink;
      session.meetingId = tokenData.meetingId || session.meetingId;
      updated = true;
    }

    // Update session to active
    session.isActive = true;
    session.activatedAt = new Date();
    await session.save();

    // Ensure we have a videoLink to return
    const responseVideoLink = tokenData.videoLink || session.hostVideoLink || session.videoLink;
    
    if (!responseVideoLink) {
      console.error('No videoLink found for session:', session._id);
      
      // Generate a fallback link if none exists
      const fallbackRoom = `classroom_${session._id.toString().substring(0, 8)}`;
      const fallbackLink = `https://${jitsiIntegration.JITSI_CONFIG.domain}/${fallbackRoom}`;
      
      // Return the fallback link
      return res.status(200).json({
        success: true,
        message: 'Session started with fallback link',
        data: {
          sessionId: session._id,
          videoLink: fallbackLink,
          videoProvider: session.videoProvider,
          meetingId: fallbackRoom
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session started successfully',
      data: {
        sessionId: session._id,
        videoLink: responseVideoLink,
        videoProvider: session.videoProvider,
        meetingId: tokenData.meetingId || session.meetingId
      },
    });
  } catch (error) {
    console.error('Error starting session:', error);
    next(error);
  }
};

/**
 * @desc    Join a live session
 * @route   POST /api/sessions/:id/join
 * @access  Private
 */
export const joinSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course', 'teacher title');

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Check if user has access to this session
    const isTeacher = req.user.role === 'teacher' && 
      session.course.teacher.toString() === req.user._id.toString();

    // Students can only join if they are enrolled
    if (req.user.role === 'student') {
      const isEnrolled = await Enrollment.exists({
        course: session.course._id,
        student: req.user._id,
        status: 'active',
      });

      if (!isEnrolled) {
        throw new ApiError('You are not enrolled in this course', 403);
      }
    }

    // Record attendance for students
    if (req.user.role === 'student') {
      await attendanceTracker.recordAttendanceOnJoin(session._id, req.user._id);
    }

    // Prepare the response object with live class data
    const liveClassData = {
      id: session._id,
      title: session.title,
      course: session.course.title,
    };

    // Generate tokens and video data based on role and provider
    let tokenData = {};

    // Generate tokens based on video provider
    if (session.videoProvider === 'jitsi' || session.videoProvider === 'other') {
      tokenData = jitsiIntegration.generateJitsiData(req.user, session);
      console.log('Generated Jitsi data for join:', JSON.stringify(tokenData));
    }

    // Determine the video link to return
    let videoLink = isTeacher ? 
      (session.hostVideoLink || tokenData.videoLink || session.videoLink) :
      (session.videoLink || tokenData.videoLink);
    
    // If still no video link, generate a fallback
    if (!videoLink) {
      console.warn('No video link found for session:', session._id);
      
      // Use meetingId if available, or generate a new one
      const roomName = session.meetingId || `classroom_${session._id.toString().substring(0, 8)}`;
      videoLink = `https://${jitsiIntegration.JITSI_CONFIG.domain}/${roomName}`;
      
      console.log('Generated fallback video link:', videoLink);
    }

    // Return appropriate data
    res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        liveClassData,
        videoLink,
        videoProvider: session.videoProvider,
        meetingId: tokenData.meetingId || session.meetingId
      },
    });
  } catch (error) {
    console.error('Error joining session:', error);
    next(error);
  }
};

/**
 * @desc    End a session (teacher only)
 * @route   POST /api/sessions/:id/end
 * @access  Private/Teacher
 */
export const endSession = async (req, res, next) => {
  try {
    // Find session
    const session = await Session.findById(req.params.id).populate('course');
    
    if (!session) {
      throw new ApiError('Session not found', 404);
    }
    
    // Check if the user is the teacher of the course
    if (session.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to end this session', 403);
    }
    
    // Update session status
    session.isActive = false;
    
    // If recording URL is provided, save it
    if (req.body.recordingUrl) {
      session.recordingUrl = req.body.recordingUrl;
    }
    
    // If marked as completed, update that too
    if (req.body.isCompleted) {
      session.isCompleted = true;
    }
    
    // Close all open attendance records
    const updatedCount = await attendanceTracker.closeAllAttendanceRecords(session._id);
    console.log(`Closed ${updatedCount} attendance records for session ${session._id}`);
    
    await session.save();
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get session status
 * @route   GET /api/sessions/:id/status
 * @access  Private
 */
export const getSessionStatus = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).select('isActive activatedAt startTime endTime isCompleted');
    
    if (!session) {
      throw new ApiError('Session not found', 404);
    }
    
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    
    // Determine timing status
    let timingStatus = 'upcoming';
    if (now > endTime) {
      timingStatus = 'ended';
    } else if (now >= startTime) {
      timingStatus = 'ongoing';
    }
    
    res.status(200).json({
      success: true,
      data: {
        isActive: session.isActive,
        isCompleted: session.isCompleted,
        activatedAt: session.activatedAt,
        timingStatus,
        canJoin: session.isActive && !session.isCompleted,
      }
    });
  } catch (error) {
    next(error);
  }
}; 