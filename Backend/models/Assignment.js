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

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number
  },
  cloudinaryId: {
    type: String,
    required: true
  }
}, { _id: false });

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Please select a course']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  totalPoints: {
    type: Number,
    default: 100
  },
  files: [fileSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for submissions
AssignmentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assignment',
  justOne: false
});

export default mongoose.model('Assignment', AssignmentSchema); 