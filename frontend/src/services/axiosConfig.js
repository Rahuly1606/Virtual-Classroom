import axios from 'axios'

// Import authService for proper logout handling 
import authService from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Debug helper for token
const getAuthToken = () => {
  const token = localStorage.getItem('token')
  console.log('Current token from localStorage:', token)
  return token
}

// List of public endpoints that don't require authentication
const publicEndpoints = [
  '/users/register',
  '/users/login',
  '/users/send-otp-public',
  '/users/verify-email-public',
  '/users/password-reset/send-otp',
  '/users/password-reset/verify'
]

// Add a request interceptor to add the auth token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip token for public endpoints
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint))
    
    if (!isPublicEndpoint) {
      const token = getAuthToken()
      if (token) {
        // Set the Authorization header with Bearer token
        config.headers.Authorization = `Bearer ${token}`
        console.log('Setting Authorization header for request to:', config.url)
      } else {
        console.log('No token available for request to:', config.url)
      }
    } else {
      console.log('Public endpoint, skipping token for:', config.url)
    }
    
    return config
  },
  (error) => {
    console.error('Request error interceptor:', error)
    return Promise.reject(error)
  }
)

// Add a response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      hasData: !!response.data
    })
    return response
  },
  (error) => {
    // Log error responses for debugging
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    })
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Skip automatic logout for public endpoints
      const isPublicEndpoint = publicEndpoints.some(endpoint => error.config?.url.includes(endpoint))
      
      if (!isPublicEndpoint) {
        console.log('Received 401 unauthorized, logging out')
        authService.logout() // Use the authService logout function
        // Don't use navigate here as it's outside React context
        // Instead redirect manually
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance 