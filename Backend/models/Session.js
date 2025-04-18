import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       required:
 *         - title
 *         - course
 *         - startTime
 *         - endTime
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the session
 *         course:
 *           type: string
 *           description: ID of the course this session belongs to
 *         description:
 *           type: string
 *           description: Description of what will be covered in this session
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Start time of the session
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: End time of the session
 *         videoLink:
 *           type: string
 *           description: URL for the video conferencing room
 *         hostVideoLink:
 *           type: string
 *           description: URL for the host (teacher) to access the video room with host privileges
 *         meetingId:
 *           type: string
 *           description: ID of the video meeting (Whereby/Jitsi/Zoom)
 *         recordingUrl:
 *           type: string
 *           description: URL to the recorded session (if available)
 *         materials:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of URLs to session materials
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the session was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the session was last updated
 */
const SessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function(value) {
          // Ensure end time is after start time
          return this.startTime < value;
        },
        message: 'End time must be after start time',
      },
    },
    videoLink: {
      type: String,
      default: '',
    },
    hostVideoLink: {
      type: String,
      default: '',
    },
    meetingId: {
      type: String,
      default: '',
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    materials: [{
      type: String,
    }],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    videoProvider: {
      type: String,
      enum: ['whereby', 'jitsi', 'other'],
      default: 'whereby',
    },
  },
  { timestamps: true }
);

const Session = mongoose.model('Session', SessionSchema);

export default Session; 