import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Submission:
 *       type: object
 *       required:
 *         - assignment
 *         - student
 *       properties:
 *         assignment:
 *           type: string
 *           description: ID of the assignment this submission is for
 *         student:
 *           type: string
 *           description: ID of the student who made the submission
 *         submissionDate:
 *           type: string
 *           format: date-time
 *           description: Date and time when the submission was made
 *         fileUrl:
 *           type: string
 *           description: URL to the submitted file
 *         comment:
 *           type: string
 *           description: Student's comment on their submission
 *         grade:
 *           type: number
 *           description: Grade awarded for the submission
 *         feedback:
 *           type: string
 *           description: Teacher's feedback on the submission
 *         status:
 *           type: string
 *           enum: [pending, graded, late, resubmitted]
 *           description: Status of the submission
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the submission record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the submission record was last updated
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

const SubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment ID is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  files: [fileSchema],
  comment: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  grade: {
    points: {
      type: Number,
      min: 0
    },
    feedback: {
      type: String
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: {
      type: Date
    }
  },
  isLate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create index for faster queries
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model('Submission', SubmissionSchema); 