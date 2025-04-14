import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       required:
 *         - session
 *         - student
 *         - status
 *       properties:
 *         session:
 *           type: string
 *           description: ID of the session for which attendance is recorded
 *         student:
 *           type: string
 *           description: ID of the student whose attendance is being recorded
 *         status:
 *           type: string
 *           enum: [present, absent, late, excused]
 *           description: Attendance status of the student
 *         notes:
 *           type: string
 *           description: Additional notes about the attendance
 *         joinTime:
 *           type: string
 *           format: date-time
 *           description: Time when the student joined the session
 *         leaveTime:
 *           type: string
 *           format: date-time
 *           description: Time when the student left the session
 *         duration:
 *           type: number
 *           description: Duration in minutes the student attended
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the attendance record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the attendance record was last updated
 */
const AttendanceSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'absent',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    joinTime: {
      type: Date,
      default: null,
    },
    leaveTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // Duration in minutes
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a student has only one attendance record per session
AttendanceSchema.index({ session: 1, student: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', AttendanceSchema);

export default Attendance; 