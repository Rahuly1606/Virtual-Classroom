import axiosInstance from './axiosConfig'

// Get all sessions for the logged-in user
const getSessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return []
  }
}

// Get all sessions for a course
const getSessionsByCourse = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/sessions/course/${courseId}`)
    return response.data.data || []
  } catch (error) {
    console.error(`Error fetching sessions for course ${courseId}:`, error)
    return []
  }
}

// Get a single session by ID
const getSessionById = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    const response = await axiosInstance.get(`/sessions/${sessionId}`)
    return response.data.data
  } catch (error) {
    console.error(`Error fetching session ${sessionId}:`, error)
    throw error
  }
}

// Get upcoming sessions for the logged-in user
const getUpcomingSessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions/upcoming')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error)
    return []
  }
}

// Get past sessions for the logged-in user
const getPastSessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions/past')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching past sessions:', error)
    return []
  }
}

// Create a new session (teacher only)
const createSession = async (sessionData) => {
  try {
    const response = await axiosInstance.post('/sessions', sessionData)
    return response.data.data
  } catch (error) {
    console.error('Error creating session:', error)
    throw error
  }
}

// Update a session (teacher only)
const updateSession = async (sessionId, sessionData) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    const response = await axiosInstance.put(`/sessions/${sessionId}`, sessionData)
    return response.data.data
  } catch (error) {
    console.error(`Error updating session ${sessionId}:`, error)
    throw error
  }
}

// Delete a session (teacher only)
const deleteSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    const response = await axiosInstance.delete(`/sessions/${sessionId}`)
    return response.data
  } catch (error) {
    console.error(`Error deleting session ${sessionId}:`, error)
    throw error
  }
}

// Join a session (generates join URL)
const joinSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    const response = await axiosInstance.post(`/sessions/${sessionId}/join`)
    return response.data.data
  } catch (error) {
    console.error(`Error joining session ${sessionId}:`, error)
    throw error
  }
}

// Mark a session as completed (teacher only)
const completeSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    const response = await axiosInstance.put(`/sessions/${sessionId}/complete`)
    return response.data.data
  } catch (error) {
    console.error(`Error completing session ${sessionId}:`, error)
    throw error
  }
}

const sessionService = {
  getSessions,
  getSessionsByCourse,
  getSessionById,
  getUpcomingSessions,
  getPastSessions,
  createSession,
  updateSession,
  deleteSession,
  joinSession,
  completeSession
}

export default sessionService 