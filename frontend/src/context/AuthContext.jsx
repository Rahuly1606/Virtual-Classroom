import { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)
  const [otpVerificationState, setOtpVerificationState] = useState({
    isVerifying: false,
    otpSent: false,
    emailVerified: false,
    verificationEmail: ''
  })
  const navigate = useNavigate()

  // Clear emailVerified from localStorage on initialization if there's no token
  useEffect(() => {
    if (!token) {
      localStorage.removeItem('emailVerified')
    }
  }, [])

  // Create a memoized logout function to avoid dependency issues
  const logout = useCallback(() => {
    authService.logout()
    localStorage.removeItem('token')
    localStorage.removeItem('emailVerified')
    setToken(null)
    setUser(null)
    toast.info('You have been logged out')
    navigate('/login')
  }, [navigate])

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!token) return null
    
    try {
      const userData = await authService.getCurrentUser()
      
      // If this user's email is verified, update the OTP verification state
      if (userData.isEmailVerified) {
        setOtpVerificationState(prev => ({
          ...prev,
          emailVerified: true
        }))
      }
      
      return userData
    } catch (error) {
      return null
    }
  }, [token])

  // Check if user is logged in on initial load
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        if (token) {
          const userData = await fetchUserProfile()
          if (userData) {
            setUser(userData)
            
            // If user's email is verified, update the OTP verification state
            if (userData.isEmailVerified === true) {
              setOtpVerificationState(prev => ({
                ...prev,
                emailVerified: true
              }))
            }
          } else {
            // If we couldn't get user data, we should logout
            logout()
          }
        }
      } catch (error) {
        logout()
      } finally {
        setLoading(false)
      }
    }

    getUserProfile()
  }, [token, logout, fetchUserProfile])

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true)
      
      // Call login service that now correctly extracts token and user
      const result = await authService.login(credentials)
      
      // Make sure we have a token before proceeding
      if (!result || !result.token) {
        throw new Error('No authentication token received from server')
      }
      
      // Store token in localStorage and state
      localStorage.setItem('token', result.token)
      setToken(result.token)
      
      // Set user data if available, otherwise fetch it
      if (result.user) {
        // Ensure isEmailVerified is explicitly set as a boolean
        result.user.isEmailVerified = result.user.isEmailVerified === true
        setUser(result.user)
        toast.success('Successfully logged in!')
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 100)
      } else {
        // If no user data in response, fetch it before redirecting
        setTimeout(async () => {
          try {
            const userData = await fetchUserProfile()
            
            if (userData) {
              setUser(userData)
              toast.success('Successfully logged in!')
              navigate('/dashboard', { replace: true })
            } else {
              throw new Error('Failed to fetch user data')
            }
          } catch (error) {
            toast.error('Logged in but failed to load user data')
            navigate('/dashboard', { replace: true })
          } finally {
            setLoading(false)
          }
        }, 500)
      }
      
      return result
    } catch (error) {
      // Extract meaningful error message from the error object
      let errorMessage = 'Login failed'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response) {
        errorMessage = error.response.data?.message || 'Server error during login'
      }
      
      // Display user-friendly error message
      toast.error(errorMessage)
      setLoading(false)
      throw error
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true)
      const data = await authService.register(userData)
      
      toast.success('Registration successful!')
      return data
    } catch (error) {
      // Extract meaningful error message from the error object
      let errorMessage = 'Registration failed'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response) {
        errorMessage = error.response.data?.message || 'Server error during registration'
      }
      
      // Display user-friendly error message
      toast.error(errorMessage)
      setLoading(false)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      setLoading(true)
      const updatedUser = await authService.updateProfile(userData)
      setUser(updatedUser)
      toast.success('Profile updated successfully!')
      return updatedUser
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Change password function
  const changePassword = async ({ oldPassword, newPassword }) => {
    try {
      setLoading(true)
      const result = await authService.changePassword({ oldPassword, newPassword })
      toast.success('Password changed successfully!')
      return result
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || 
                          error.response?.data?.message || 
                          'Failed to change password';
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Send password reset OTP
  const sendPasswordResetOTP = async (email) => {
    try {
      setLoading(true)
      const result = await authService.sendPasswordResetOTP(email);
      toast.success(`OTP sent to ${email}`);
      return result;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send password reset OTP');
      throw error;
    } finally {
      setLoading(false)
    }
  };

  // Reset password with OTP
  const resetPasswordWithOTP = async (email, otp, newPassword) => {
    try {
      setLoading(true)
      const result = await authService.resetPasswordWithOTP(email, otp, newPassword);
      toast.success('Password reset successfully!');
      return result;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      throw error;
    } finally {
      setLoading(false)
    }
  };

  // Send verification OTP (for authenticated users)
  const sendVerificationOTP = async () => {
    try {
      setOtpVerificationState(prev => ({ 
        ...prev, 
        isVerifying: true,
      }));
      
      const result = await authService.sendVerificationOTP();
      
      if (result.success) {
        setOtpVerificationState(prev => ({ 
          ...prev, 
          isVerifying: false,
          otpSent: true 
        }));
        toast.success('OTP sent to your email');
      }
      
      return result;
    } catch (error) {
      setOtpVerificationState(prev => ({ 
        ...prev, 
        isVerifying: false 
      }));
      toast.error(error.response?.data?.message || 'Failed to send OTP');
      throw error;
    }
  };

  // Send verification OTP (public - during registration)
  const sendVerificationOTPPublic = async (email) => {
    try {
      setOtpVerificationState(prev => ({ 
        ...prev, 
        isVerifying: true,
        verificationEmail: email
      }));
      
      const result = await authService.sendVerificationOTPPublic(email);
      
      if (result.success) {
        setOtpVerificationState(prev => ({ 
          ...prev, 
          isVerifying: false,
          otpSent: true
        }));
        toast.success('OTP sent to your email');
      }
      
      return result;
    } catch (error) {
      setOtpVerificationState(prev => ({ 
        ...prev, 
        isVerifying: false 
      }));
      toast.error(error.response?.data?.message || 'Failed to send OTP');
      throw error;
    }
  };

  // Verify email with OTP (for authenticated users)
  const verifyEmail = async (otp) => {
    try {
      setOtpVerificationState(prev => ({ 
        ...prev, 
        isVerifying: true,
      }));
      
      const result = await authService.verifyEmail(otp);
      
      if (result.success) {
        setOtpVerificationState({
          isVerifying: false,
          otpSent: false,
          emailVerified: false
        });
        
        setUser(prev => ({
          ...prev,
          isEmailVerified: true
        }));
        
        toast.success('Email verified successfully');
      }
      
      return result;
    } catch (error) {
      setOtpVerificationState(prev => ({ 
        ...prev, 
        isVerifying: false 
      }));
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
      throw error;
    }
  };

  // Verify email with OTP (public - during registration)
  const verifyEmailPublic = async (email, otp) => {
    try {
      const emailToVerify = email || otpVerificationState.verificationEmail;
      
      if (!emailToVerify) {
        toast.error('Email address is missing');
        throw new Error('Email address is missing');
      }
      
      setOtpVerificationState(prev => ({ 
        ...prev, 
        isVerifying: true
      }));
      
      const result = await authService.verifyEmailPublic(emailToVerify, otp);
      
      if (result.success) {
        setOtpVerificationState({
          isVerifying: false,
          otpSent: false,
          emailVerified: false,
          verificationEmail: emailToVerify
        });
        
        toast.success('Email verified successfully');
      }
      
      return result;
    } catch (error) {
      setOtpVerificationState(prev => ({ 
        ...prev, 
        isVerifying: false 
      }));
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
      throw error;
    }
  };

  // Reset OTP verification state
  const resetOtpVerification = () => {
    setOtpVerificationState({
      isVerifying: false,
      otpSent: false,
      emailVerified: user?.isEmailVerified || false,
      verificationEmail: ''
    })
  }

  const contextValue = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    sendPasswordResetOTP,
    resetPasswordWithOTP,
    sendVerificationOTP,
    sendVerificationOTPPublic,
    verifyEmail,
    verifyEmailPublic,
    otpVerificationState,
    resetOtpVerification,
    isAuthenticated: !!token,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isEmailVerified: user?.isEmailVerified || false
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 