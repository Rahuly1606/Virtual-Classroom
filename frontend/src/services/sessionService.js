import axiosInstance from './axiosConfig'

// Get all sessions for the logged-in user
const getSessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching sessions:', error)
    throw error;
  }
}

// Get all sessions for a course
const getSessionsByCourse = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/sessions/course/${courseId}`)
    return response.data.data || []
  } catch (error) {
    console.error(`Error fetching sessions for course ${courseId}:`, error)
    throw error;
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
    throw error;
  }
}

// Get upcoming sessions for the logged-in user
const getUpcomingSessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions/upcoming')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error)
    throw error;
  }
}

// Get past sessions for the logged-in user
const getPastSessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions/past')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching past sessions:', error)
    throw error;
  }
}

// Create a new session (teacher only)
const createSession = async (sessionData) => {
  try {
    const response = await axiosInstance.post('/sessions', sessionData)
    return response.data.data
  } catch (error) {
    console.error('Error creating session:', error)
    throw error;
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
    throw error;
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
    throw error;
  }
}

// Start a live session (teacher only)
const startSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    const response = await axiosInstance.post(`/sessions/${sessionId}/start`)
    
    const sessionData = response.data;
    
    return sessionData;
  } catch (error) {
    console.error(`Error starting session ${sessionId}:`, error)
    throw error;
  }
}

// End a live session (teacher only)
const endSession = async (sessionId, data = {}) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    const payload = { 
      ...data,
      videoProvider: 'jitsi'
    };
    
    const response = await axiosInstance.post(`/sessions/${sessionId}/end`, payload)
    return response.data.data
  } catch (error) {
    console.error(`Error ending session ${sessionId}:`, error)
    throw error;
  }
}

// Get session status
const getSessionStatus = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    const response = await axiosInstance.get(`/sessions/${sessionId}/status`)
    return response.data.data
  } catch (error) {
    console.error(`Error getting session status ${sessionId}:`, error)
    throw error;
  }
}

// Join a session (generates join token)
const joinSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    const response = await axiosInstance.post(`/sessions/${sessionId}/join`)
    
    const sessionData = response.data;
    
    return sessionData;
  } catch (error) {
    console.error(`Error joining session ${sessionId}:`, error)
    throw error;
  }
}

// Mark a session as completed (teacher only)
const completeSession = async (sessionId, recordingUrl = '') => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    const payload = {
      recordingUrl,
      videoProvider: 'jitsi'
    };
    
    const response = await axiosInstance.put(`/sessions/${sessionId}/complete`, payload)
    return response.data.data
  } catch (error) {
    console.error(`Error completing session ${sessionId}:`, error)
    throw error;
  }
}

// Toggle session completion status
const toggleSessionStatus = async (sessionId, isCompleted) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    if (isCompleted) {
      return await completeSession(sessionId);
    } 
    
    return await updateSession(sessionId, { isCompleted: false });
  } catch (error) {
    console.error(`Error toggling session status ${sessionId}:`, error)
    throw error;
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
  completeSession,
  toggleSessionStatus,
  startSession,
  endSession,
  getSessionStatus
}

export default sessionService 