import Attendance from '../models/Attendance.js';

/**
 * Updates the attendance record when a student leaves the session
 * @param {string} sessionId - ID of the session
 * @param {string} studentId - ID of the student
 * @returns {Promise<Object>} - Updated attendance record
 */
export const updateAttendanceOnLeave = async (sessionId, studentId) => {
  try {
    // Find the latest attendance record for this student and session
    const attendanceRecord = await Attendance.findOne({
      session: sessionId,
      student: studentId,
      leaveTime: null // Find record that doesn't have a leave time set
    }).sort({ joinTime: -1 }); // Get the most recent join
    
    if (!attendanceRecord) {
      console.log(`No open attendance record found for student ${studentId} in session ${sessionId}`);
      return null;
    }
    
    // Update the leave time
    attendanceRecord.leaveTime = new Date();
    
    // Calculate duration in minutes
    const joinTime = new Date(attendanceRecord.joinTime);
    const leaveTime = new Date(attendanceRecord.leaveTime);
    const durationMs = leaveTime - joinTime;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    attendanceRecord.durationMinutes = durationMinutes;
    
    // Save the updated record
    await attendanceRecord.save();
    
    return attendanceRecord;
  } catch (error) {
    console.error('Error updating attendance on leave:', error);
    throw error;
  }
};

/**
 * Records a new attendance entry when a student joins a session
 * @param {string} sessionId - ID of the session
 * @param {string} studentId - ID of the student
 * @returns {Promise<Object>} - New attendance record
 */
export const recordAttendanceOnJoin = async (sessionId, studentId) => {
  try {
    // First, check if there's an open attendance record
    const existingRecord = await Attendance.findOne({
      session: sessionId,
      student: studentId,
      leaveTime: null
    });
    
    // If there's an existing open record, return it
    if (existingRecord) {
      console.log(`Student ${studentId} already has an open attendance record for session ${sessionId}`);
      return existingRecord;
    }
    
    // Create a new attendance record
    const attendance = new Attendance({
      session: sessionId,
      student: studentId,
      joinTime: new Date()
    });
    
    await attendance.save();
    return attendance;
  } catch (error) {
    console.error('Error recording attendance on join:', error);
    throw error;
  }
};

/**
 * Gets attendance statistics for a session
 * @param {string} sessionId - ID of the session
 * @returns {Promise<Object>} - Statistics about attendance for the session
 */
export const getSessionAttendanceStats = async (sessionId) => {
  try {
    // Aggregate to get total students and average duration
    const stats = await Attendance.aggregate([
      { $match: { session: sessionId } },
      { $group: {
        _id: '$student',
        totalDuration: { $sum: '$durationMinutes' },
        joinCount: { $sum: 1 },
        firstJoin: { $min: '$joinTime' },
        lastLeave: { $max: '$leaveTime' }
      }},
      { $group: {
        _id: null,
        uniqueStudents: { $sum: 1 },
        averageDuration: { $avg: '$totalDuration' },
        maxDuration: { $max: '$totalDuration' },
        totalJoins: { $sum: '$joinCount' }
      }}
    ]);
    
    // Return formatted stats
    if (stats.length === 0) {
      return {
        uniqueStudents: 0,
        averageDurationMinutes: 0,
        maxDurationMinutes: 0,
        totalJoins: 0
      };
    }
    
    return {
      uniqueStudents: stats[0].uniqueStudents,
      averageDurationMinutes: Math.round(stats[0].averageDuration || 0),
      maxDurationMinutes: stats[0].maxDuration || 0,
      totalJoins: stats[0].totalJoins
    };
  } catch (error) {
    console.error('Error getting session attendance stats:', error);
    throw error;
  }
};

/**
 * Updates all open attendance records for a session when it ends
 * @param {string} sessionId - ID of the session
 * @returns {Promise<number>} - Number of records updated
 */
export const closeAllAttendanceRecords = async (sessionId) => {
  try {
    // Find all open attendance records for this session
    const openRecords = await Attendance.find({
      session: sessionId,
      leaveTime: null
    });
    
    // Update each record
    const now = new Date();
    let updatedCount = 0;
    
    for (const record of openRecords) {
      record.leaveTime = now;
      
      // Calculate duration
      const joinTime = new Date(record.joinTime);
      const durationMs = now - joinTime;
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      
      record.durationMinutes = durationMinutes;
      await record.save();
      updatedCount++;
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error closing all attendance records:', error);
    throw error;
  }
}; 