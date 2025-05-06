import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from './errorHandler.js';

// Protect routes
export const protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return next(new ApiError('User not found', 401));
      }

      next();
    } catch (error) {
      console.error(error);
      return next(new ApiError('Not authorized, token failed', 401));
    }
  }

  if (!token) {
    return next(new ApiError('Not authorized, no token', 401));
  }
};

// Authorize by role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('User not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `Role (${req.user.role}) is not authorized to access this resource`,
          403
        )
      );
    }
    
    next();
  };
}; 