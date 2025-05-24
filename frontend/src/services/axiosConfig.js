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
    const token = localStorage.getItem('token');
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/verify-email'];
    
    if (token && !publicEndpoints.includes(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error interceptor:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance 