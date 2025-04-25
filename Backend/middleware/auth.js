import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Fallback JWT secret for development (only used if JWT_SECRET env var is not set)
const DEV_JWT_SECRET = 'virtual_classroom_dev_secret_key_2023';

// Debug level: 0 = none, 1 = errors only, 2 = errors + warnings, 3 = all (verbose)
const DEBUG_LEVEL = 1;

// Helper logging function that respects debug level
const log = {
  error: (message, ...args) => {
    if (DEBUG_LEVEL >= 1) console.error(message, ...args);
  },
  warn: (message, ...args) => {
    if (DEBUG_LEVEL >= 2) console.warn(message, ...args);
  },
  info: (message, ...args) => {
    if (DEBUG_LEVEL >= 3) console.log(message, ...args);
  }
};

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  try {
    // Check if authorization header exists and has the correct format
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];
      
      log.info('Auth middleware received token:', token ? token.substring(0, 15) + '...' : 'null');
      
      // Check if token exists
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token missing in authorization header',
        });
      }
      
      try {
        // Get JWT secret with fallback
        const jwtSecret = process.env.JWT_SECRET || DEV_JWT_SECRET;
        
        // Verify token
        const decoded = jwt.verify(token, jwtSecret);
        log.info('Token successfully verified:', decoded.id);
        
        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          log.error('User not found with token ID:', decoded.id);
          return res.status(401).json({
            success: false,
            message: 'User not found with this token',
          });
        }
        
        // Set user in request object
        req.user = user;
        next();
      } catch (verifyError) {
        log.error('Token verification failed:', verifyError.message);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token invalid',
          error: verifyError.message,
        });
      }
    } else {
      log.info('No authorization header or invalid format');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided in header',
      });
    }
  } catch (error) {
    log.error('Error in auth middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message,
    });
  }
};

// Middleware to restrict access based on user role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Generate JWT Token
export const generateToken = (id) => {
  // Get JWT secret with fallback
  const jwtSecret = process.env.JWT_SECRET || DEV_JWT_SECRET;
  
  // Make sure JWT_SECRET or fallback is defined
  if (!jwtSecret) {
    log.error('JWT_SECRET is not defined in environment variables and no fallback is available');
    throw new Error('JWT_SECRET must be defined');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'; // Default to 7 days if not specified
  
  log.info(`Generating token for user ${id} with expiration: ${expiresIn}`);
  
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: expiresIn,
  });
}; 