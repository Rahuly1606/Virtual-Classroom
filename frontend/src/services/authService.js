import axiosInstance from './axiosConfig'

// Login user
const login = async (credentials) => {
  try {
    const response = await axiosInstance.post('/users/login', credentials)
    
    // Debug response from server
    console.log('Login response:', response.data)
    
    // Extract data from the nested structure
    // The server returns { success: true, data: { user, token } }
    const responseData = response.data
    
    if (responseData.success && responseData.data) {
      // Log the complete data object to see all fields
      console.log('Login data object:', responseData.data)
      
      // Extract token and user from the data object
      // The backend format should be data.token and data.user
      const { token, user } = responseData.data
      
      console.log('Extracted token:', token ? `${token.substring(0, 15)}...` : 'null')
      console.log('Extracted user data:', user)
      
      // Validate token exists
      if (!token) {
        console.error('No token in the data object:', responseData)
        throw new Error('Authentication failed: No token in response data')
      }
      
      // Return the token and user in the expected format
      return { token, user }
    } else {
      console.error('Invalid response structure:', responseData)
      throw new Error('Authentication failed: Invalid response structure')
    }
  } catch (error) {
    console.error('Login error details:', error)
    throw error
  }
}

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
    throw error
  }
}

// Get current user
const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('/users/me')
    
    console.log('getCurrentUser response:', response.data)
    
    // Handle nested response structure
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return response.data
  } catch (error) {
    console.error('Get current user error:', error)
    throw error
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
    throw error
  }
}

// Change user password
const changePassword = async (passwordData) => {
  try {
    const response = await axiosInstance.put('/users/change-password', passwordData)
    return response.data
  } catch (error) {
    console.error('Change password error:', error)
    throw error
  }
}

// Logout user
const logout = () => {
  try {
    // Remove token from localStorage
    localStorage.removeItem('token')
    return true
  } catch (error) {
    console.error('Logout error:', error)
    return false
  }
}

// Export as default as well
const authService = {
  login,
  register,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout
}

export default authService 