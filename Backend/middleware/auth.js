import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
      
      console.log('Auth middleware received token:', token ? token.substring(0, 15) + '...' : 'null');
      
      // Check if token exists
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token missing in authorization header',
        });
      }
      
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token successfully verified:', decoded.id);
        
        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          console.log('User not found with token ID:', decoded.id);
          return res.status(401).json({
            success: false,
            message: 'User not found with this token',
          });
        }
        
        // Set user in request object
        req.user = user;
        next();
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError.message);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token invalid',
          error: verifyError.message,
        });
      }
    } else {
      console.log('No authorization header or invalid format');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided in header',
      });
    }
  } catch (error) {
    console.error('Error in auth middleware:', error);
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
  // Make sure JWT_SECRET and JWT_EXPIRES_IN are defined
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT_SECRET must be defined');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'; // Default to 7 days if not specified
  
  console.log(`Generating token for user ${id} with expiration: ${expiresIn}`);
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
}; 