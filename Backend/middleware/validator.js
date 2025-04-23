import { body, validationResult, param, query } from 'express-validator';

// Middleware to handle validation errors
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation rules
export const userValidationRules = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['student', 'teacher']).withMessage('Role must be either student or teacher')
  ],
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address'),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
  ],
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('bio')
      .optional()
      .trim(),
    body('section')
      .optional()
      .trim(),
    body('year')
      .optional()
      .trim()
  ],
  changePassword: [
    body('oldPassword')
      .trim()
      .notEmpty().withMessage('Old password is required'),
    body('newPassword')
      .trim()
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ]
};

// Course validation rules
export const courseValidationRules = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Course title is required')
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim(),
    body('subject')
      .optional()
      .trim(),
    body('startDate')
      .optional()
      .isISO8601().toDate().withMessage('Start date must be a valid date'),
    body('endDate')
      .optional()
      .isISO8601().toDate().withMessage('End date must be a valid date')
  ],
  update: [
    param('id')
      .isMongoId().withMessage('Invalid course ID format'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim(),
    body('subject')
      .optional()
      .trim(),
    body('startDate')
      .optional()
      .isISO8601().toDate().withMessage('Start date must be a valid date'),
    body('endDate')
      .optional()
      .isISO8601().toDate().withMessage('End date must be a valid date')
  ]
};

// Session validation rules
export const sessionValidationRules = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Session title is required'),
    body('course')
      .notEmpty().withMessage('Course ID is required')
      .isMongoId().withMessage('Invalid course ID format'),
    body('startTime')
      .notEmpty().withMessage('Start time is required')
      .isISO8601().toDate().withMessage('Start time must be a valid date'),
    body('endTime')
      .notEmpty().withMessage('End time is required')
      .isISO8601().toDate().withMessage('End time must be a valid date'),
    body('description')
      .optional()
      .trim()
  ],
  update: [
    param('id')
      .isMongoId().withMessage('Invalid session ID format'),
    body('title')
      .optional()
      .trim(),
    body('startTime')
      .optional()
      .isISO8601().toDate().withMessage('Start time must be a valid date'),
    body('endTime')
      .optional()
      .isISO8601().toDate().withMessage('End time must be a valid date'),
    body('description')
      .optional()
      .trim(),
    body('isCompleted')
      .optional()
      .isBoolean().withMessage('isCompleted must be a boolean value')
  ]
};

// Assignment validation rules
export const assignmentValidationRules = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Assignment title is required'),
    body('course')
      .notEmpty().withMessage('Course ID is required')
      .isMongoId().withMessage('Invalid course ID format'),
    body('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isISO8601().toDate().withMessage('Due date must be a valid date'),
    body('totalPoints')
      .optional()
      .isNumeric().withMessage('Total points must be a number')
      .custom(value => value >= 0).withMessage('Total points cannot be negative'),
    body('description')
      .optional()
      .trim()
  ],
  update: [
    param('id')
      .isMongoId().withMessage('Invalid assignment ID format'),
    body('title')
      .optional()
      .trim(),
    body('dueDate')
      .optional()
      .isISO8601().toDate().withMessage('Due date must be a valid date'),
    body('totalPoints')
      .optional()
      .isNumeric().withMessage('Total points must be a number')
      .custom(value => value >= 0).withMessage('Total points cannot be negative'),
    body('description')
      .optional()
      .trim()
  ]
};

// Submission validation rules
export const submissionValidationRules = {
  create: [
    body('assignment')
      .notEmpty().withMessage('Assignment ID is required')
      .isMongoId().withMessage('Invalid assignment ID format'),
    body('comment')
      .optional()
      .trim()
  ],
  grade: [
    param('id')
      .isMongoId().withMessage('Invalid submission ID format'),
    body('grade')
      .notEmpty().withMessage('Grade is required')
      .isNumeric().withMessage('Grade must be a number')
      .custom(value => value >= 0).withMessage('Grade cannot be negative'),
    body('feedback')
      .optional()
      .trim()
  ]
};

// Attendance validation rules
export const attendanceValidationRules = {
  create: [
    body('session')
      .notEmpty().withMessage('Session ID is required')
      .isMongoId().withMessage('Invalid session ID format'),
    body('student')
      .notEmpty().withMessage('Student ID is required')
      .isMongoId().withMessage('Invalid student ID format'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status value'),
    body('notes')
      .optional()
      .trim()
  ],
  update: [
    param('id')
      .isMongoId().withMessage('Invalid attendance ID format'),
    body('status')
      .optional()
      .isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status value'),
    body('notes')
      .optional()
      .trim(),
    body('joinTime')
      .optional()
      .isISO8601().toDate().withMessage('Join time must be a valid date'),
    body('leaveTime')
      .optional()
      .isISO8601().toDate().withMessage('Leave time must be a valid date')
  ]
}; 