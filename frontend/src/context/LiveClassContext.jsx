import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import sessionService from '../services/sessionService';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

// Create context
const LiveClassContext = createContext();

// Initial state
const initialState = {
  activeSession: null,
  isSessionActive: false,
  joinLink: null,
  participants: [],
  isLoading: false,
  error: null,
  inactivityTimer: null,
  jitsiApi: null
};

// Reducer function
function liveClassReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ACTIVE_SESSION':
      return { 
        ...state, 
        activeSession: action.payload, 
        isSessionActive: !!action.payload,
        error: null 
      };
    case 'SET_JOIN_LINK':
      return { ...state, joinLink: action.payload };
    case 'ADD_PARTICIPANT':
      return { 
        ...state, 
        participants: [...state.participants, action.payload] 
      };
    case 'REMOVE_PARTICIPANT':
      return { 
        ...state, 
        participants: state.participants.filter(p => p.id !== action.payload) 
      };
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'SET_JITSI_API':
      return { ...state, jitsiApi: action.payload };
    case 'RESET_STATE':
      return { ...initialState };
    default:
      return state;
  }
}

// Provider component
export const LiveClassProvider = ({ children }) => {
  const [state, dispatch] = useReducer(liveClassReducer, initialState);
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [inactivityTimeout, setInactivityTimeout] = useState(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
      endActiveSession();
    };
  }, []);

  // Start session (teacher only)
  const startSession = async (sessionId) => {
    if (!isTeacher) {
      dispatch({ type: 'SET_ERROR', payload: 'Only teachers can start sessions' });
      return null;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await sessionService.startSession(sessionId);
      
      console.log('Start session response in context:', response);
      
      // Even if response is null or undefined, the sessionService now returns a fallback
      // Instead of throwing an error, we'll create an active session with whatever we have
      const videoLink = response?.videoLink || `https://meet.jit.si/fallback_${sessionId.substring(0, 8)}`;
      
      dispatch({ 
        type: 'SET_ACTIVE_SESSION', 
        payload: { 
          id: sessionId,
          videoLink: videoLink,
          meetingId: response?.meetingId,
          startedAt: new Date()
        } 
      });
      
      dispatch({ type: 'SET_JOIN_LINK', payload: videoLink });
      
      // Start inactivity detection
      startInactivityDetection(sessionId);
      
      return response;
    } catch (error) {
      console.error('Error starting session:', error);
      
      // If we got here, something really bad happened - but we'll still try to recover
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 7);
      const fallbackRoom = `videoroom_${timestamp}_${randomStr}`;
      const fallbackData = {
        videoLink: `https://meet.jit.si/${fallbackRoom}`,
        meetingId: fallbackRoom
      };
      
      // Create an active session with our fallback data
      dispatch({ 
        type: 'SET_ACTIVE_SESSION', 
        payload: { 
          id: sessionId,
          videoLink: fallbackData.videoLink,
          meetingId: fallbackData.meetingId,
          startedAt: new Date()
        } 
      });
      
      dispatch({ type: 'SET_JOIN_LINK', payload: fallbackData.videoLink });
      
      // Don't show an error message, just inform the user we're using a fallback
      toast.info("Using fallback video room due to server issues");
      
      return fallbackData;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Join session (students and teachers)
  const joinSession = async (sessionId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await sessionService.joinSession(sessionId);
      
      console.log('Join session response in context:', response);
      
      // Even if response is null or undefined, the sessionService now returns a fallback
      // Instead of throwing an error, we'll create an active session with whatever we have
      const videoLink = response?.videoLink || `https://meet.jit.si/fallback_${sessionId.substring(0, 8)}`;
      
      dispatch({ 
        type: 'SET_ACTIVE_SESSION', 
        payload: { 
          id: sessionId,
          videoLink: videoLink,
          meetingId: response?.meetingId,
          joinedAt: new Date()
        } 
      });
      
      dispatch({ type: 'SET_JOIN_LINK', payload: videoLink });
      
      return response;
    } catch (error) {
      console.error('Error joining session:', error);
      
      // If we got here, something really bad happened - but we'll still try to recover
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 7);
      const fallbackRoom = `videoroom_${timestamp}_${randomStr}`;
      const fallbackData = {
        videoLink: `https://meet.jit.si/${fallbackRoom}`,
        meetingId: fallbackRoom
      };
      
      // Create an active session with our fallback data
      dispatch({ 
        type: 'SET_ACTIVE_SESSION', 
        payload: { 
          id: sessionId,
          videoLink: fallbackData.videoLink,
          meetingId: fallbackData.meetingId,
          joinedAt: new Date()
        } 
      });
      
      dispatch({ type: 'SET_JOIN_LINK', payload: fallbackData.videoLink });
      
      // Don't show an error message, just inform the user we're using a fallback
      toast.info("Using fallback video room due to server issues");
      
      return fallbackData;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // End session (teacher only)
  const endSession = async (sessionId, isCompleted = false) => {
    if (!isTeacher) {
      dispatch({ type: 'SET_ERROR', payload: 'Only teachers can end sessions' });
      return false;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await sessionService.endSession(sessionId, { isCompleted });
      
      // Clear inactivity timer
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
        setInactivityTimeout(null);
      }

      // Reset state
      dispatch({ type: 'RESET_STATE' });
      
      toast.success('Session ended successfully');
      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to end session' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // End current active session
  const endActiveSession = () => {
    if (state.activeSession && isTeacher) {
      endSession(state.activeSession.id);
    }
  };

  // Start inactivity detection (ends session after 30 minutes of inactivity)
  const startInactivityDetection = (sessionId) => {
    if (!isTeacher) return;
    
    // Clear any existing timeout
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
    
    // Set new timeout (30 minutes)
    const timeout = setTimeout(() => {
      // Check if there's participant activity
      if (state.participants.length <= 1) { // Only teacher present
        toast.info('Ending session due to inactivity');
        endSession(sessionId);
      } else {
        // Reset the timer if participants are present
        startInactivityDetection(sessionId);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    setInactivityTimeout(timeout);
  };

  // Update participant list
  const updateParticipants = (participants) => {
    dispatch({ type: 'SET_PARTICIPANTS', payload: participants });
    
    // Reset inactivity timer if teacher and participants change
    if (isTeacher && state.activeSession) {
      startInactivityDetection(state.activeSession.id);
    }
  };

  // Set JitsiMeet API reference
  const setJitsiApi = (api) => {
    dispatch({ type: 'SET_JITSI_API', payload: api });
  };

  // Leave session (for students)
  const leaveSession = () => {
    if (state.jitsiApi) {
      state.jitsiApi.executeCommand('hangup');
    }
    dispatch({ type: 'RESET_STATE' });
  };

  // Context value
  const value = {
    ...state,
    startSession,
    joinSession,
    endSession,
    leaveSession,
    updateParticipants,
    setJitsiApi,
    isTeacher
  };

  return (
    <LiveClassContext.Provider value={value}>
      {children}
    </LiveClassContext.Provider>
  );
};

// Custom hook for using the context
export const useLiveClass = () => {
  const context = useContext(LiveClassContext);
  if (!context) {
    throw new Error('useLiveClass must be used within a LiveClassProvider');
  }
  return context;
};

export default LiveClassContext; 