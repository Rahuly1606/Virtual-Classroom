import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { sendOtpEmail } from '../utils/emailService.js';
import { generateOTP, verifyOTP } from '../utils/otpService.js';

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, isEmailVerified } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new ApiError('User already exists with this email', 400);
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student', // Default role is student
      isEmailVerified: isEmailVerified || false, // Allow frontend to pass verification status
    });

    if (user) {
      // Generate token
      const token = generateToken(user._id);

      // If email is not verified, send verification OTP
      let otpForDev = null;
      if (!user.isEmailVerified) {
        const otp = generateOTP(user.email);
        otpForDev = otp;
        
        try {
          const emailResult = await sendOtpEmail(user.email, otp);
          console.log('Registration email result:', emailResult);
        } catch (emailError) {
          console.error('Error sending verification email during registration:', emailError);
          // We don't throw here, just log the error and continue with registration
          // The user can request OTP later using the send-otp endpoint
        }
      }

      const responseData = {
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          token,
        }
      };
      
      // In development mode, include the OTP for easier testing
      if (process.env.NODE_ENV === 'development' && otpForDev) {
        console.log(`Development mode: Registration OTP for ${user.email} is: ${otpForDev}`);
        responseData.devOtp = otpForDev;
      }

      res.status(201).json(responseData);
    } else {
      throw new ApiError('Invalid user data', 400);
    }
  } catch (error) {
    console.error('User registration error:', error);
    next(error);
  }
};

/**
 * @desc    Send OTP for email verification
 * @route   POST /api/users/send-otp
 * @access  Private
 */
export const sendVerificationOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
      });
    }

    // Generate OTP
    const otp = generateOTP(user.email);
    console.log(`Generated OTP for ${user.email}: ${otp}`);
    
    try {
      // Send OTP
      const emailResult = await sendOtpEmail(user.email, otp);
      console.log('Email send result:', emailResult);
      
      // Check if we have a mock success in development mode
      if (emailResult.success === true && process.env.NODE_ENV === 'development') {
        console.log(`Development mode: OTP for ${user.email} is: ${otp}`);
        res.status(200).json({
          success: true,
          message: 'OTP sent successfully to your email',
          devOtp: otp // Only include in development mode
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'OTP sent successfully to your email',
        });
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      
      // Always return success in development mode for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: The OTP for ${user.email} is: ${otp}`);
        res.status(200).json({
          success: true,
          message: 'Development mode: OTP generated but email failed. Check server logs for OTP.',
          devOtp: otp // Only include in development mode
        });
      } else {
        throw new ApiError('Failed to send OTP email. Please try again later.', 500);
      }
    }
  } catch (error) {
    console.error('Send verification OTP error:', error);
    next(error);
  }
};

/**
 * @desc    Verify email with OTP
 * @route   POST /api/users/verify-email
 * @access  Private
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    
    if (!otp) {
      throw new ApiError('OTP is required', 400);
    }
    
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
        data: {
          isEmailVerified: true
        }
      });
    }

    // Verify OTP
    const isValidOTP = verifyOTP(user.email, otp);
    
    if (!isValidOTP) {
      // Log OTP verification attempt for debugging
      console.log(`OTP verification failed for user ${user.email}. Provided OTP: ${otp}`);
      
      // Check if we're in development mode and should bypass verification
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Bypassing OTP verification and marking email as verified');
        user.isEmailVerified = true;
        await user.save();
        
        return res.status(200).json({
          success: true,
          message: 'Development mode: Email verified successfully (OTP validation bypassed)',
          data: {
            isEmailVerified: true,
          },
        });
      }
      
      throw new ApiError('Invalid or expired OTP', 400);
    }

    // Update user's email verification status
    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password matches
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      bio: user.bio,
      section: user.section,
      year: user.year
    };

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/users/me
 * @access  Private
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Explicitly include isEmailVerified in the response
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        section: user.section,
        year: user.year,
        isEmailVerified: user.isEmailVerified
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Explicitly include isEmailVerified in the response
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        section: user.section,
        year: user.year,
        isEmailVerified: user.isEmailVerified
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Update fields if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.bio) user.bio = req.body.bio;
    if (req.body.section) user.section = req.body.section;
    if (req.body.year) user.year = req.body.year;

    // Handle profile picture upload
    if (req.file) {
      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        section: updatedUser.section,
        year: updatedUser.year,
        isEmailVerified: updatedUser.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      throw new ApiError('Please provide both old and new passwords', 400);
    }

    // Find user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new ApiError('Old password is incorrect', 401);
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = async (req, res, next) => {
  try {
    // Filter users by role if provided in query
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send OTP for email verification (public version for registration)
 * @route   POST /api/users/send-otp-public
 * @access  Public
 */
export const sendVerificationOTPPublic = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new ApiError('Email is required', 400);
    }

    // Check if the email format is valid
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError('Invalid email format', 400);
    }

    // Check if user with this email exists (optional)
    const existingUser = await User.findOne({ email });
    
    // If user exists and their email is already verified, return success
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
        data: {
          isEmailVerified: true
        }
      });
    }

    // Generate OTP
    const otp = generateOTP(email);
    console.log(`Generated public OTP for ${email}: ${otp}`);
    
    try {
      // Send OTP
      const emailResult = await sendOtpEmail(email, otp);
      console.log('Public email send result:', emailResult);
      
      // Check if we have a mock success in development mode
      if (emailResult.success === true && process.env.NODE_ENV === 'development') {
        console.log(`Development mode: Public OTP for ${email} is: ${otp}`);
        
        res.status(200).json({
          success: true,
          message: 'OTP sent successfully to your email',
          devOtp: otp // Only include in development mode
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'OTP sent successfully to your email',
        });
      }
    } catch (emailError) {
      console.error('Failed to send public OTP email:', emailError);
      
      // Always return success in development mode for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: The public OTP for ${email} is: ${otp}`);
        
        res.status(200).json({
          success: true,
          message: 'Development mode: OTP generated but email failed. Check server logs for OTP.',
          devOtp: otp // Only include in development mode
        });
      } else {
        throw new ApiError('Failed to send OTP email. Please try again later.', 500);
      }
    }
  } catch (error) {
    console.error('Send public verification OTP error:', error);
    next(error);
  }
};

/**
 * @desc    Verify email with OTP (public version for registration)
 * @route   POST /api/users/verify-email-public
 * @access  Public
 */
export const verifyEmailPublic = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      throw new ApiError('Email and OTP are required', 400);
    }

    // Check if user with this email exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new ApiError('User with this email not found', 404);
    }

    // Check if email is already verified
    if (existingUser.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
        data: {
          isEmailVerified: true
        }
      });
    }

    // Verify OTP
    const isValidOTP = verifyOTP(email, otp);
    
    if (!isValidOTP) {
      // Log OTP verification attempt
      console.log(`Public OTP verification failed for ${email}. Provided OTP: ${otp}`);
      
      // Development mode bypass
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Bypassing public OTP verification');
        existingUser.isEmailVerified = true;
        await existingUser.save();
        
        return res.status(200).json({
          success: true,
          message: 'Development mode: Email verified successfully (OTP validation bypassed)',
          data: {
            isEmailVerified: true,
          },
        });
      }
      
      throw new ApiError('Invalid or expired OTP', 400);
    }

    // Update user's verification status
    existingUser.isEmailVerified = true;
    await existingUser.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error('Public email verification error:', error);
    next(error);
  }
};

/**
 * @desc    Send OTP for password reset
 * @route   POST /api/users/password-reset/send-otp
 * @access  Public
 */
export const sendPasswordResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new ApiError('Email is required', 400);
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError('User with this email does not exist', 404);
    }

    // Generate and send OTP
    const otp = generateOTP(email);
    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent successfully to your email',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP and reset password
 * @route   POST /api/users/password-reset/verify
 * @access  Public
 */
export const verifyOTPAndResetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      throw new ApiError('Email, OTP, and new password are required', 400);
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError('User with this email does not exist', 404);
    }

    // Verify OTP
    const isValidOTP = verifyOTP(email, otp);
    if (!isValidOTP) {
      throw new ApiError('Invalid or expired OTP', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
}; 