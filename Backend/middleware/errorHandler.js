// Custom error class
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } 
  // Production error response
  else {
    // Operational errors: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
      });
    } 
    // Programming/unknown errors: don't leak error details
    else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong',
      });
    }
  }
};

// Handle MongoDB duplicate key error
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${value} for field ${field}. Please use another value.`;
  return new ApiError(message, 400);
};

// Handle MongoDB validation error
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ApiError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => new ApiError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new ApiError('Your token has expired. Please log in again.', 401);

export { 
  ApiError, 
  errorHandler, 
  handleDuplicateKeyError, 
  handleValidationError, 
  handleJWTError, 
  handleJWTExpiredError 
}; 