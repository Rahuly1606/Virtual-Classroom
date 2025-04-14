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
const SubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    comment: {
      type: String,
      default: '',
    },
    grade: {
      type: Number,
      min: 0,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'graded', 'late', 'resubmitted'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Compound index to ensure a student has only one submission per assignment
// (but allows for resubmissions by updating the existing document)
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Submission = mongoose.model('Submission', SubmissionSchema);

export default Submission; 