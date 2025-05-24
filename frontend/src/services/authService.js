import axiosInstance from './axiosConfig'

// Login user
const login = async (credentials) => {
  try {
    const response = await axiosInstance.post('/users/login', credentials);
    const { token, user } = response.data;
    
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } else {
      console.error('Unexpected response structure:', response.data);
      throw new Error('Invalid login response');
    }
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

// Register user
const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/users/register', userData)
    
    // Handle nested response structure
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return response.data
  } catch (error) {
    console.error('Register error:', error)
    throw error;
  }
}

// Get current user
const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('/users/me')
    
    console.log('getCurrentUser response:', response.data)
    
    // Handle nested response structure
    let userData;
    if (response.data.success && response.data.data) {
      userData = response.data.data;
    } else {
      userData = response.data;
    }
    
    // Ensure isEmailVerified is explicitly set
    userData.isEmailVerified = userData.isEmailVerified === true;
    
    console.log('Processed user data with verification status:', userData.isEmailVerified);
    return userData;
  } catch (error) {
    console.error('Get current user error:', error)
    throw error;
  }
}

// Update user profile
const updateProfile = async (userData) => {
  try {
    const response = await axiosInstance.put('/users/profile', userData)
    
    // Handle nested response structure
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return response.data
  } catch (error) {
    console.error('Update profile error:', error)
    throw error;
  }
}

// Change user password
const changePassword = async (passwordData) => {
  try {
    const response = await axiosInstance.put('/users/change-password', passwordData)
    return response.data
  } catch (error) {
    console.error('Change password error:', error)
    throw error;
  }
}

// Logout user
const logout = () => {
  try {
    // Remove token from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return true
  } catch (error) {
    console.error('Logout error:', error)
    throw error;
  }
}

// Send OTP for email verification (for already authenticated users)
const sendVerificationOTP = async () => {
  try {
    const response = await axiosInstance.post('/users/send-otp');
    return response.data;
  } catch (error) {
    console.error('Send OTP error:', error);
    throw error;
  }
};

// Verify email with OTP (for already authenticated users)
const verifyEmail = async (otp) => {
  try {
    const response = await axiosInstance.post('/users/verify-email', { otp });
    return response.data;
  } catch (error) {
    console.error('Verify email error:', error);
    throw error;
  }
};

// Send OTP for email verification (public - during registration)
const sendVerificationOTPPublic = async (email) => {
  try {
    const response = await axiosInstance.post('/users/send-otp-public', { email });
    return response.data;
  } catch (error) {
    console.error('Send public OTP error:', error);
    throw error;
  }
};

// Verify email with OTP (public - during registration)
const verifyEmailPublic = async (email, otp) => {
  try {
    const response = await axiosInstance.post('/users/verify-email-public', { email, otp });
    return response.data;
  } catch (error) {
    console.error('Verify public email error:', error);
    throw error;
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (email) => {
  try {
    const response = await axiosInstance.post('/users/password-reset/send-otp', { email });
    return response.data;
  } catch (error) {
    console.error('Send password reset OTP error:', error);
    throw error;
  }
};

// Reset password with OTP
const resetPasswordWithOTP = async (email, otp, newPassword) => {
  try {
    const response = await axiosInstance.post('/users/password-reset/verify', { 
      email, 
      otp, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    console.error('Reset password with OTP error:', error);
    throw error;
  }
};

// Export as default as well
const authService = {
  login,
  register,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  sendVerificationOTP,
  verifyEmail,
  sendVerificationOTPPublic,
  verifyEmailPublic,
  sendPasswordResetOTP,
  resetPasswordWithOTP
}

export default authService 