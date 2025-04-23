import { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Create a memoized logout function to avoid dependency issues
  const logout = useCallback(() => {
    authService.logout()
    setToken(null)
    setUser(null)
    toast.info('You have been logged out')
    navigate('/login')
  }, [navigate])

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!token) return null
    
    try {
      console.log('Fetching user profile with token:', token)
      const userData = await authService.getCurrentUser()
      console.log('Fetched user data:', userData)
      return userData
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
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
          } else {
            // If we couldn't get user data, we should logout
            logout()
          }
        }
      } catch (error) {
        console.error('Failed to get user profile:', error)
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
      
      console.log('Login result from auth service:', result)
      
      // Make sure we have a token before proceeding
      if (!result || !result.token) {
        throw new Error('No authentication token received from server')
      }
      
      // Store token in localStorage and state
      localStorage.setItem('token', result.token)
      console.log('Token stored in localStorage:', result.token.substring(0, 15) + '...')
      
      // Set token in state
      setToken(result.token)
      
      // Set user data if available, otherwise fetch it
      if (result.user) {
        console.log('Setting user from login response:', result.user)
        setUser(result.user)
        toast.success('Successfully logged in!')
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 100) // Short delay to ensure state updates
      } else {
        // If no user data in response, fetch it before redirecting
        console.log('User data not in login response, fetching separately...')
        
        // We need to wait a moment for the token to be set in axios config
        setTimeout(async () => {
          try {
            const userData = await fetchUserProfile()
            
            if (userData) {
              console.log('User data fetched successfully:', userData)
              setUser(userData)
              toast.success('Successfully logged in!')
              navigate('/dashboard', { replace: true })
            } else {
              throw new Error('Failed to fetch user data')
            }
          } catch (error) {
            console.error('Error fetching user after login:', error)
            toast.error('Logged in but failed to load user data')
            navigate('/dashboard', { replace: true })
          } finally {
            setLoading(false)
          }
        }, 500)
      }
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
      setLoading(false)
      throw error
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true)
      const data = await authService.register(userData)
      toast.success('Registration successful! Please login.')
      navigate('/login')
      return data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
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

  const contextValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!token,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 