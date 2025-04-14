import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       required:
 *         - student
 *         - course
 *       properties:
 *         student:
 *           type: string
 *           description: ID of the student enrolled in the course
 *         course:
 *           type: string
 *           description: ID of the course the student is enrolled in
 *         enrollmentDate:
 *           type: string
 *           format: date-time
 *           description: Date when the student enrolled in the course
 *         status:
 *           type: string
 *           enum: [active, completed, dropped]
 *           description: Status of the enrollment
 *         grade:
 *           type: number
 *           description: Final grade for the student in this course
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the enrollment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the enrollment was last updated
 */
const EnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active',
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a student can enroll in a course only once
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);

export default Enrollment; 