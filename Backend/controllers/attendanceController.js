import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * @desc    Mark attendance for a student
 * @route   POST /api/attendance
 * @access  Private/Teacher
 */
export const markAttendance = async (req, res, next) => {
  try {
    const { session, student, status, notes } = req.body;

    // Check if session exists
    const sessionDoc = await Session.findById(session).populate('course');
    if (!sessionDoc) {
      throw new ApiError('Session not found', 404);
    }

    // Check if user is the teacher of the course
    if (sessionDoc.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to mark attendance for this session', 403);
    }

    // Check if student is enrolled in the course
    const isEnrolled = await Enrollment.exists({
      course: sessionDoc.course._id,
      student,
      status: 'active',
    });

    if (!isEnrolled) {
      throw new ApiError('Student is not enrolled in this course', 400);
    }

    // Check if attendance already exists
    let attendance = await Attendance.findOne({ session, student });

    if (attendance) {
      // Update existing attendance
      attendance.status = status;
      if (notes) attendance.notes = notes;
      
      // Set join time if student is marked present and it wasn't set before
      if (status === 'present' && !attendance.joinTime) {
        attendance.joinTime = new Date();
      }
      
      await attendance.save();
    } else {
      // Create new attendance record
      const attendanceData = {
        session,
        student,
        status,
        notes: notes || '',
      };
      
      // Set join time if student is present
      if (status === 'present') {
        attendanceData.joinTime = new Date();
      }
      
      attendance = await Attendance.create(attendanceData);
    }

    res.status(201).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark attendance for multiple students in a session
 * @route   POST /api/attendance/bulk
 * @access  Private/Teacher
 */
export const markBulkAttendance = async (req, res, next) => {
  try {
    const { session, attendanceRecords } = req.body;

    // Check if session exists
    const sessionDoc = await Session.findById(session).populate('course');
    if (!sessionDoc) {
      throw new ApiError('Session not found', 404);
    }

    // Check if user is the teacher of the course
    if (sessionDoc.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to mark attendance for this session', 403);
    }

    // Get all enrolled students
    const enrollments = await Enrollment.find({
      course: sessionDoc.course._id,
      status: 'active',
    });
    
    const enrolledStudentIds = enrollments.map(e => e.student.toString());

    // Validate that all students in the records are enrolled
    for (const record of attendanceRecords) {
      if (!enrolledStudentIds.includes(record.student.toString())) {
        throw new ApiError(`Student ${record.student} is not enrolled in this course`, 400);
      }
    }

    // Process each attendance record
    const operations = attendanceRecords.map(record => ({
      updateOne: {
        filter: { session, student: record.student },
        update: { 
          $set: { 
            status: record.status,
            notes: record.notes || '',
            joinTime: record.status === 'present' ? new Date() : null
          }
        },
        upsert: true
      }
    }));

    // Execute bulk operation
    const result = await Attendance.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Bulk attendance marked successfully',
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance for a session
 * @route   GET /api/attendance/session/:sessionId
 * @access  Private/Teacher
 */
export const getSessionAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists
    const session = await Session.findById(sessionId).populate('course');
    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Check if user is the teacher of the course
    if (req.user.role === 'teacher' && session.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to view attendance for this session', 403);
    }

    // Get all attendance records for this session
    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate('student', 'name email profilePicture');

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance for a student across all sessions in a course
 * @route   GET /api/attendance/student/:studentId/course/:courseId
 * @access  Private/Teacher or Private/Student (own records)
 */
export const getStudentCourseAttendance = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // Check if student is enrolled in the course
    const isEnrolled = await Enrollment.exists({
      course: courseId,
      student: studentId,
      status: 'active',
    });

    if (!isEnrolled) {
      throw new ApiError('Student is not enrolled in this course', 400);
    }

    // Access control checks
    if (req.user.role === 'teacher') {
      // Teachers can only view attendance for their courses
      if (course.teacher.toString() !== req.user._id.toString()) {
        throw new ApiError('Not authorized to view attendance for this course', 403);
      }
    } else {
      // Students can only view their own attendance
      if (req.user._id.toString() !== studentId) {
        throw new ApiError('Not authorized to view another student\'s attendance', 403);
      }
    }

    // Get all sessions for this course
    const sessions = await Session.find({ course: courseId });
    const sessionIds = sessions.map(session => session._id);

    // Get attendance records for all sessions in the course for this student
    const attendanceRecords = await Attendance.find({
      session: { $in: sessionIds },
      student: studentId,
    }).populate('session', 'title startTime endTime');

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance statistics for a course
 * @route   GET /api/attendance/stats/course/:courseId
 * @access  Private/Teacher
 */
export const getCourseAttendanceStats = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // Check if user is the teacher of the course
    if (course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to view attendance stats for this course', 403);
    }

    // Get all sessions for this course
    const sessions = await Session.find({ course: courseId });
    const sessionIds = sessions.map(session => session._id);

    // Get all enrolled students
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'active',
    }).populate('student', 'name');
    
    const students = enrollments.map(e => ({ 
      _id: e.student._id, 
      name: e.student.name 
    }));

    // Get attendance stats
    const attendanceStats = [];

    for (const student of students) {
      // Count attendance records by status
      const present = await Attendance.countDocuments({
        session: { $in: sessionIds },
        student: student._id,
        status: 'present',
      });
      
      const absent = await Attendance.countDocuments({
        session: { $in: sessionIds },
        student: student._id,
        status: 'absent',
      });
      
      const late = await Attendance.countDocuments({
        session: { $in: sessionIds },
        student: student._id,
        status: 'late',
      });
      
      const excused = await Attendance.countDocuments({
        session: { $in: sessionIds },
        student: student._id,
        status: 'excused',
      });

      // Calculate attendance percentage
      const totalMarked = present + absent + late + excused;
      const attendancePercentage = totalMarked > 0 
        ? Math.round((present + late) / totalMarked * 100) 
        : 0;

      attendanceStats.push({
        student: {
          _id: student._id,
          name: student.name,
        },
        stats: {
          present,
          absent,
          late,
          excused,
          total: totalMarked,
          percentage: attendancePercentage,
        },
      });
    }

    res.status(200).json({
      success: true,
      totalSessions: sessions.length,
      totalStudents: students.length,
      data: attendanceStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private/Teacher
 */
export const updateAttendance = async (req, res, next) => {
  try {
    const attendanceRecord = await Attendance.findById(req.params.id);
    
    if (!attendanceRecord) {
      throw new ApiError('Attendance record not found', 404);
    }

    // Check if the user has permission to update
    const session = await Session.findById(attendanceRecord.session)
      .populate('course');
    
    if (!session) {
      throw new ApiError('Associated session not found', 404);
    }

    // Check if user is the teacher of the course
    if (session.course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to update this attendance record', 403);
    }

    // Update the attendance record
    const { status, notes, joinTime, leaveTime } = req.body;
    
    if (status) attendanceRecord.status = status;
    if (notes !== undefined) attendanceRecord.notes = notes;
    if (joinTime) attendanceRecord.joinTime = joinTime;
    if (leaveTime) attendanceRecord.leaveTime = leaveTime;
    
    // Calculate duration if both joinTime and leaveTime are present
    if (attendanceRecord.joinTime && attendanceRecord.leaveTime) {
      const joinDate = new Date(attendanceRecord.joinTime);
      const leaveDate = new Date(attendanceRecord.leaveTime);
      
      // Duration in minutes
      attendanceRecord.duration = Math.round((leaveDate - joinDate) / (1000 * 60));
    }

    await attendanceRecord.save();

    res.status(200).json({
      success: true,
      data: attendanceRecord,
    });
  } catch (error) {
    next(error);
  }
}; 