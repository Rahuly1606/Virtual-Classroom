import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  BiEdit, 
  BiTrash, 
  BiArrowBack, 
  BiCalendar, 
  BiTime, 
  BiUser, 
  BiBook,
  BiVideo,
  BiListCheck,
  BiBookOpen,
  BiPlay,
  BiRefresh,
  BiCheck
} from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import JitsiMeet from '../../components/JitsiMeet'
import useAuth from '../../hooks/useAuth'
import sessionService from '../../services/sessionService'
import attendanceService from '../../services/attendanceService'
import { toast } from 'react-toastify'

const SessionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isTeacher } = useAuth()
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [startingSession, setStartingSession] = useState(false)
  const [session, setSession] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showMeeting, setShowMeeting] = useState(false)
  const [sessionStatus, setSessionStatus] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [liveClassData, setLiveClassData] = useState(null)
  const jitsiContainerRef = useRef(null);
  const sessionApiRef = useRef(null);
  
  // Timer to refresh session status
  useEffect(() => {
    const timer = setInterval(() => {
      if (session) {
        fetchSessionStatus();
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(timer);
  }, [session]);
  
  // Fetch session status from API
  const fetchSessionStatus = async () => {
    try {
      if (!id) return;
      
      const statusData = await sessionService.getSessionStatus(id);
      setSessionStatus({
        isActive: statusData.isActive,
        isCompleted: statusData.isCompleted,
        timingStatus: statusData.timingStatus,
        canJoin: statusData.canJoin
      });
      
      // Calculate time left if upcoming
      if (statusData.timingStatus === 'upcoming') {
        const now = new Date();
        const startTime = new Date(session.startTime);
        const diffMs = startTime - now;
        const diffMinutes = Math.floor(diffMs / 60000);
        setTimeLeft(`${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`);
      } else {
        setTimeLeft(null);
      }
      
    } catch (error) {
      console.error('Error fetching session status:', error);
    }
  };
  
  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true)
        
        // Check if ID is valid before making API call
        if (!id) {
          toast.error('Invalid session ID')
          navigate('/sessions')
          return
        }
        
        const sessionData = await sessionService.getSessionById(id)
        setSession(sessionData)
        
        // Fetch initial status
        await fetchSessionStatus();
        
      } catch (error) {
        console.error('Error fetching session data:', error)
        toast.error('Failed to load session details')
        navigate('/sessions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessionData()
  }, [id, navigate])
  
  // Handle session deletion
  const handleDeleteSession = async () => {
    try {
      setLoading(true)
      await sessionService.deleteSession(id)
      toast.success('Session deleted successfully')
      navigate('/sessions')
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Failed to delete session')
      setLoading(false)
    }
  }
  
  // Handle starting a session (for teachers)
  const handleStartSession = async () => {
    if (!isTeacher) return;
    
    try {
      setStartingSession(true);
      
      // If teachers start the session early, let's provide appropriate feedback
      if (sessionStatus?.timingStatus === 'upcoming') {
        toast.info('Starting session ahead of schedule. Students will be notified.');
      }
      
      // Call the start session API
      const data = await sessionService.startSession(id);
      
      // Log the data for debugging
      console.log('Start session response:', data);
      
      // Set video session data
      if (data.videoLink) {
        setLiveClassData({
          id: id,
          videoLink: data.videoLink
        });
        setShowMeeting(true);
        toast.success('Live classroom started successfully');
      } else {
        throw new Error('Failed to get classroom data');
      }
      
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start the classroom session: ' + (error.message || 'Unknown error'));
    } finally {
      setStartingSession(false);
    }
  };
  
  // Handle joining video session
  const handleJoinSession = async () => {
    if (isTeacher) {
      return handleStartSession();
    }
    
    if (!sessionStatus?.canJoin) {
      toast.warning(timeLeft 
        ? `This session is not available yet. You can join in ${timeLeft}.` 
        : 'This session is not currently active'
      );
      return;
    }
    
    try {
      setJoining(true);
      
      // Call the join session API
      const data = await sessionService.joinSession(id);
      
      // Log the data for debugging
      console.log('Join session response:', data);
      
      // Set video session data
      if (data.videoLink) {
        setLiveClassData({
          id: id,
          videoLink: data.videoLink
        });
        setShowMeeting(true);
        toast.success('Joining classroom session');
      } else {
        throw new Error('Failed to get join data');
      }
      
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join the classroom: ' + (error.message || 'Unknown error'));
    } finally {
      setJoining(false);
    }
  };
  
  // Handle meeting joined event
  const handleMeetingJoined = () => {
    // Different messages based on role
    if (isTeacher) {
      toast.success('You have started the session as host');
    } else {
      toast.success('You have joined the classroom');
    }
  };
  
  // Handle meeting left event
  const handleMeetingLeft = async () => {
    setShowMeeting(false);
    
    // If teacher ends session, call the end session API
    if (isTeacher) {
      try {
        await sessionService.endSession(id);
        toast.info('You have ended the live session');
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  };
  
  // Handle meeting error
  const handleMeetingError = (error) => {
    console.error('Meeting error:', error);
    toast.error('Video meeting error: ' + error.message);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get appropriate button text based on session status
  const getActionButtonText = () => {
    if (isTeacher) {
      if (joining || startingSession) {
        return 'Starting...';
      } else if (showMeeting) {
        return 'End Session';
      } else if (sessionStatus?.isCompleted) {
        return 'Session Completed';
      } else if (sessionStatus?.isActive) {
        return 'Rejoin Session';
      } else {
        return 'Start Session';
      }
    } else {
      if (joining) {
        return 'Joining...';
      } else if (showMeeting) {
        return 'Leave Session';
      } else if (sessionStatus?.isCompleted) {
        return 'Session Completed';
      } else if (sessionStatus?.isActive) {
        return 'Join Session';
      } else {
        return 'Session Not Started';
      }
    }
  };
  
  // Get status label based on session status
  const getStatusLabel = () => {
    if (sessionStatus?.isCompleted) {
      return 'Completed';
    } else if (sessionStatus?.isActive) {
      return 'Live Now';
    } else if (sessionStatus?.timingStatus === 'upcoming') {
      return timeLeft ? `Starts in ${timeLeft}` : 'Upcoming';
    } else if (sessionStatus?.timingStatus === 'past') {
      return 'Past (Not Started)';
    } else {
      return 'Scheduled';
    }
  };
  
  // Get color for status badge
  const getStatusColor = () => {
    if (sessionStatus?.isCompleted) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    } else if (sessionStatus?.isActive) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (sessionStatus?.timingStatus === 'upcoming') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else if (sessionStatus?.timingStatus === 'past') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Handle completing a session
  const handleCompleteSession = async () => {
    if (!isTeacher) return;
    
    try {
      await sessionService.completeSession(id);
      
      // Update session data after completion
      const updatedSession = await sessionService.getSessionById(id);
      setSession(updatedSession);
      
      // Refresh status
      await fetchSessionStatus();
      
      toast.success('Session marked as completed');
      
      // If in a meeting, leave it
      if (showMeeting) {
        handleMeetingLeft();
      }
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    }
  };
  
  // Handle refreshing session status
  const handleRefreshStatus = () => {
    fetchSessionStatus();
    toast.info('Refreshing session status...');
  };
  
  // Handle Jitsi API reference
  const handleApiReference = (api) => {
    sessionApiRef.current = api;
  };
  
  if (loading) {
    return <div className="text-center py-20"><Spinner /></div>
  }
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/sessions" className="mr-2">
            <Button variant="outline" size="sm">
              <BiArrowBack className="mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {session.title}
            <span className={`ml-3 text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshStatus}
            className="flex items-center"
          >
            <BiRefresh className="mr-1" /> Refresh
          </Button>
          
          {isTeacher && !sessionStatus?.isCompleted && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={handleCompleteSession}
            >
              <BiCheck className="mr-1" /> Mark Complete
            </Button>
          )}
          
          {isTeacher && (
            <Link to={`/sessions/edit/${id}`}>
              <Button variant="outline" size="sm">
                <BiEdit className="mr-1" /> Edit
              </Button>
            </Link>
          )}
          
          {isTeacher && !deleteConfirm ? (
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => setDeleteConfirm(true)}
            >
              <BiTrash className="mr-1" /> Delete
            </Button>
          ) : isTeacher && (
            <div className="flex gap-2">
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleDeleteSession}
              >
                Confirm
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Session Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <BiBook className="text-primary-600 dark:text-primary-500 text-xl mr-2 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Course</h3>
                    <p>{session.course.title}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <BiCalendar className="text-primary-600 dark:text-primary-500 text-xl mr-2 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</h3>
                    <p>{new Date(session.startTime).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <BiTime className="text-primary-600 dark:text-primary-500 text-xl mr-2 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Time</h3>
                    <p>{new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <BiUser className="text-primary-600 dark:text-primary-500 text-xl mr-2 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Host</h3>
                    <p>{session.isTeacher ? 'You' : 'Course Teacher'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <BiVideo className="text-primary-600 dark:text-primary-500 text-xl mr-2 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Video Provider</h3>
                    <p>Jitsi Meet</p>
                  </div>
                </div>
                
                {session.description && (
                  <div className="flex items-start">
                    <BiListCheck className="text-primary-600 dark:text-primary-500 text-xl mr-2 mt-1" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</h3>
                      <p>{session.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {!showMeeting && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Join Session</h2>
                <Button 
                  variant="primary" 
                  className="w-full justify-center"
                  disabled={
                    (joining || startingSession) || 
                    (!isTeacher && !sessionStatus?.canJoin) ||
                    sessionStatus?.isCompleted
                  }
                  onClick={showMeeting ? handleMeetingLeft : handleJoinSession}
                >
                  {getActionButtonText()}
                </Button>
                
                {!isTeacher && !sessionStatus?.canJoin && !sessionStatus?.isCompleted && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {timeLeft 
                      ? `Session will be available in ${timeLeft}.` 
                      : 'This session is not active yet. Please wait for the teacher to start it.'}
                  </p>
                )}
              </div>
            </Card>
          )}
          
          {/* More session details could be added here */}
        </div>
        
        <div className="lg:col-span-2">
          {showMeeting ? (
            <Card className="overflow-hidden h-full">
              <div className="p-4 bg-primary-700 text-white flex justify-between items-center">
                <h2 className="text-lg font-medium">Live Classroom</h2>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={handleMeetingLeft}
                >
                  Leave Meeting
                </Button>
              </div>
              
              <div className="h-[600px] relative">
                {liveClassData ? (
                  <JitsiMeet
                    roomName={session.meetingId || id}
                    displayName={user?.name || 'User'}
                    onApiReady={handleApiReference}
                    onMeetingJoined={handleMeetingJoined}
                    onMeetingLeft={handleMeetingLeft}
                    onError={handleMeetingError}
                    className="w-full h-full"
                    domain="meet.jit.si"
                    isHost={isTeacher}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Spinner />
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-6">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                  <BiBookOpen className="text-6xl mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <h2 className="text-xl font-semibold mb-2">Ready to start the session?</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {isTeacher
                      ? "Start the session to begin the virtual classroom experience."
                      : "Join when the teacher starts the session."}
                  </p>
                  
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="mx-auto"
                    disabled={
                      (joining || startingSession) || 
                      (!isTeacher && !sessionStatus?.canJoin) ||
                      sessionStatus?.isCompleted
                    }
                    onClick={handleJoinSession}
                  >
                    {isTeacher 
                      ? (sessionStatus?.isActive ? 'Join Session' : 'Start Session') 
                      : 'Join Session'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionDetail 