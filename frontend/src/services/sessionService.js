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
    
    // Log the update attempt
    console.log(`Updating session ${sessionId} with data:`, sessionData)
    
    // Make the API call
    const response = await axiosInstance.put(`/sessions/${sessionId}`, sessionData)
    
    // Log the successful response
    console.log(`Session ${sessionId} update response:`, response.data)
    
    return response.data.data
  } catch (error) {
    // Enhanced error logging
    console.error(`Error updating session ${sessionId}:`, error)
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error data:', error.response.data)
      console.error('Response status:', error.response.status)
      console.error('Response headers:', error.response.headers)
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Request details:', error.request)
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message)
    }
    
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

// Start a live session (teacher only)
const startSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    console.log(`Starting session with ID: ${sessionId}`)
    const response = await axiosInstance.post(`/sessions/${sessionId}/start`)
    
    // Log the full raw response for debugging
    console.log('RAW SESSION START RESPONSE:', response)
    console.log('RESPONSE DATA:', response.data)
    console.log('RESPONSE DATA TYPE:', typeof response.data)
    
    if (!response || !response.data) {
      throw new Error('Invalid response format')
    }
    
    // Handle different response formats - sometimes the API might return data directly
    // or it might be nested under a data property
    let sessionData;
    
    if (response.data.data) {
      // Standard format: { success: true, data: {...} }
      sessionData = response.data.data;
    } else if (response.data.success === true && typeof response.data === 'object') {
      // Alternative format where data might be at the top level
      sessionData = response.data;
    } else {
      // Create fallback data if the response format is unexpected
      console.warn('Unexpected response format:', response.data);
      
      // Generate fallback room name and URL
      const fallbackRoom = `videoroom_${Math.random().toString(36).substring(2, 9)}`;
      sessionData = {
        sessionId: sessionId,
        meetingId: fallbackRoom,
        videoLink: `https://meet.jit.si/${fallbackRoom}`,
        videoProvider: 'jitsi'
      };
      console.log('Created fallback session data:', sessionData);
    }
    
    // Ensure we always have a videoLink
    if (!sessionData.videoLink && sessionData.meetingId) {
      sessionData.videoLink = `https://meet.jit.si/${sessionData.meetingId}`;
      console.log('Constructed videoLink from meetingId:', sessionData.videoLink);
    } else if (!sessionData.videoLink) {
      // Last resort - create a completely random room
      const fallbackRoom = `videoroom_${Math.random().toString(36).substring(2, 9)}`;
      sessionData.videoLink = `https://meet.jit.si/${fallbackRoom}`;
      sessionData.meetingId = fallbackRoom;
      console.log('Created fallback videoLink:', sessionData.videoLink);
    }
    
    return sessionData;
  } catch (error) {
    console.error(`Error starting session ${sessionId}:`, error)
    
    // If there's an error, try to return a usable fallback
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    const fallbackRoom = `videoroom_${timestamp}_${randomStr}`;
    const fallbackData = {
      sessionId: sessionId,
      meetingId: fallbackRoom,
      videoLink: `https://meet.jit.si/${fallbackRoom}`,
      videoProvider: 'jitsi'
    };
    
    console.log('Error recovery: Created fallback data:', fallbackData);
    return fallbackData;
  }
}

// End a live session (teacher only)
const endSession = async (sessionId, data = {}) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    // Add videoProvider as jitsi to ensure compatibility
    const payload = { 
      ...data,
      videoProvider: 'jitsi' // Explicitly set to avoid 'hms' validation error
    };
    
    console.log(`Ending session ${sessionId} with data:`, payload);
    const response = await axiosInstance.post(`/sessions/${sessionId}/end`, payload)
    return response.data.data
  } catch (error) {
    console.error(`Error ending session ${sessionId}:`, error)
    // Don't throw the error, return a default response
    return {
      success: false,
      message: error.message || 'Failed to end session',
      sessionId: sessionId
    };
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
    throw error
  }
}

// Join a session (generates join token)
const joinSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    console.log(`Joining session with ID: ${sessionId}`)
    const response = await axiosInstance.post(`/sessions/${sessionId}/join`)
    
    // Log the full raw response for debugging
    console.log('RAW SESSION JOIN RESPONSE:', response)
    console.log('JOIN RESPONSE DATA:', response.data)
    console.log('JOIN RESPONSE DATA TYPE:', typeof response.data)
    
    if (!response || !response.data) {
      throw new Error('Invalid response format')
    }
    
    // Handle different response formats - sometimes the API might return data directly
    // or it might be nested under a data property
    let sessionData;
    
    if (response.data.data) {
      // Standard format: { success: true, data: {...} }
      sessionData = response.data.data;
    } else if (response.data.success === true && typeof response.data === 'object') {
      // Alternative format where data might be at the top level
      sessionData = response.data;
    } else {
      // Create fallback data if the response format is unexpected
      console.warn('Unexpected join response format:', response.data);
      
      // Generate fallback room name and URL
      const fallbackRoom = `videoroom_${Math.random().toString(36).substring(2, 9)}`;
      sessionData = {
        sessionId: sessionId,
        meetingId: fallbackRoom,
        videoLink: `https://meet.jit.si/${fallbackRoom}`,
        videoProvider: 'jitsi'
      };
      console.log('Created fallback join session data:', sessionData);
    }
    
    // Ensure we always have a videoLink
    if (!sessionData.videoLink && sessionData.meetingId) {
      sessionData.videoLink = `https://meet.jit.si/${sessionData.meetingId}`;
      console.log('Constructed join videoLink from meetingId:', sessionData.videoLink);
    } else if (!sessionData.videoLink) {
      // Last resort - create a completely random room
      const fallbackRoom = `videoroom_${Math.random().toString(36).substring(2, 9)}`;
      sessionData.videoLink = `https://meet.jit.si/${fallbackRoom}`;
      sessionData.meetingId = fallbackRoom;
      console.log('Created fallback join videoLink:', sessionData.videoLink);
    }
    
    return sessionData;
  } catch (error) {
    console.error(`Error joining session ${sessionId}:`, error)
    
    // Even if there's an error, try to return a usable fallback
    const fallbackRoom = `videoroom_${Math.random().toString(36).substring(2, 9)}`;
    const fallbackData = {
      sessionId: sessionId,
      meetingId: fallbackRoom,
      videoLink: `https://meet.jit.si/${fallbackRoom}`,
      videoProvider: 'jitsi'
    };
    
    console.log('Error recovery: Created fallback join data:', fallbackData);
    return fallbackData;
  }
}

// Mark a session as completed (teacher only)
const completeSession = async (sessionId, recordingUrl = '') => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    // Add videoProvider as jitsi to ensure compatibility
    const payload = {
      recordingUrl,
      videoProvider: 'jitsi' // Explicitly set to avoid 'hms' validation error
    };
    
    console.log(`Completing session ${sessionId} with data:`, payload);
    const response = await axiosInstance.put(`/sessions/${sessionId}/complete`, payload)
    return response.data.data
  } catch (error) {
    console.error(`Error completing session ${sessionId}:`, error)
    // Don't throw the error, return a default response
    return {
      success: false,
      message: error.message || 'Failed to complete session',
      sessionId: sessionId
    };
  }
}

// Toggle session completion status
const toggleSessionStatus = async (sessionId, isCompleted) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
    
    // If marking as complete, use the dedicated endpoint
    if (isCompleted) {
      return await completeSession(sessionId);
    } 
    
    // Otherwise, use the general update endpoint to mark as incomplete
    return await updateSession(sessionId, { isCompleted: false });
  } catch (error) {
    console.error(`Error toggling session status ${sessionId}:`, error)
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
  completeSession,
  toggleSessionStatus,
  startSession,
  endSession,
  getSessionStatus
}

export default sessionService 