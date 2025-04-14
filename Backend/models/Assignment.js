import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       required:
 *         - title
 *         - course
 *         - dueDate
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the assignment
 *         description:
 *           type: string
 *           description: Detailed description of the assignment
 *         course:
 *           type: string
 *           description: ID of the course this assignment belongs to
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date and time for the assignment
 *         totalPoints:
 *           type: number
 *           description: Maximum points possible for this assignment
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of URLs to assignment materials/attachments
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the assignment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the assignment was last updated
 */
const AssignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    totalPoints: {
      type: Number,
      default: 100,
      min: [0, 'Total points cannot be negative'],
    },
    attachments: [{
      type: String,
    }],
  },
  { timestamps: true }
);

const Assignment = mongoose.model('Assignment', AssignmentSchema);

export default Assignment; 