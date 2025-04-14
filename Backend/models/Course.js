import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - title
 *         - teacher
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the course
 *         description:
 *           type: string
 *           description: Description of the course
 *         teacher:
 *           type: string
 *           description: ID of the teacher who created the course
 *         coverImage:
 *           type: string
 *           description: URL to the course cover image
 *         subject:
 *           type: string
 *           description: Subject or category of the course
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the course
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of the course
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the course was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the course was last updated
 */
const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverImage: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: function() {
        // Default end date is 3 months from start
        const endDate = new Date(this.startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        return endDate;
      },
    },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', CourseSchema);

export default Course; 