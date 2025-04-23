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
  const [hasJoined, setHasJoined] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [sessionStatus, setSessionStatus] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const jitsiContainerRef = useRef(null);
  const sessionApiRef = useRef(null);
  
  // Timer to refresh session status
  useEffect(() => {
    const timer = setInterval(() => {
      if (session) {
        updateSessionStatus();
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(timer);
  }, [session]);
  
  // Calculate session timing status
  const updateSessionStatus = () => {
    if (!session) return;
    
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    
    // Allow teachers to join 15 minutes early and anytime during the session
    const teacherJoinBuffer = new Date(startTime);
    teacherJoinBuffer.setMinutes(teacherJoinBuffer.getMinutes() - 15);
    
    // Students can join 5 minutes early but only if the session is active
    const studentJoinBuffer = new Date(startTime);
    studentJoinBuffer.setMinutes(studentJoinBuffer.getMinutes() - 5);
    
    // Calculate time left until session starts
    if (now < startTime) {
      const diffMs = startTime - now;
      const diffMinutes = Math.floor(diffMs / 60000);
      setTimeLeft(`${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`);
    } else {
      setTimeLeft(null);
    }
    
    // For teachers:
    // - Can start the session 15 minutes before the scheduled time
    // - Can start or join anytime during the session (between start and end)
    // For students:
    // - Can only join when the session is live (during the scheduled time)
    // - Can join 5 minutes early if the session is about to start
    
    // Set session status
    if (now > endTime) {
      // Session has ended for everyone
      setSessionStatus('ended');
      setIsActive(false);
    } else if (now >= startTime) {
      // Session is currently active (within scheduled time)
      setSessionStatus('live');
      setIsActive(true);
    } else if (isTeacher && now >= teacherJoinBuffer) {
      // Teacher can start the session early (15 min before)
      setSessionStatus('teacher-ready');
      setIsActive(true);
    } else if (!isTeacher && now >= studentJoinBuffer) {
      // Students can join 5 min before if the session is about to start
      setSessionStatus('student-ready');
      setIsActive(true);
    } else {
      // Upcoming session, not yet ready to join
      setSessionStatus('upcoming');
      setIsActive(false);
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
        
        // Update session status
        updateSessionStatus();
        
      } catch (error) {
        console.error('Error fetching session data:', error)
        toast.error('Failed to load session details')
        navigate('/sessions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessionData()
  }, [id, navigate, isTeacher])
  
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
      if (sessionStatus === 'teacher-ready') {
        toast.info('Starting session early. Students will be able to join at the scheduled time.');
      } else if (sessionStatus === 'upcoming') {
        toast.warn('Starting session ahead of schedule.');
      }
      
      // Teacher is starting the session - record this in attendance if needed
      // This could be expanded to update the session status in the backend
      
      // Show the Jitsi component for the teacher
      setShowMeeting(true);
      
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    } finally {
      setStartingSession(false);
    }
  };
  
  // Handle joining video session (for students)
  const handleJoinSession = async () => {
    if (isTeacher) {
      return handleStartSession();
    }
    
    if (!isActive) {
      toast.warning(timeLeft 
        ? `This session is not available yet. You can join in ${timeLeft}.` 
        : 'This session is not currently active'
      );
      return;
    }
    
    try {
      setJoining(true)
      
      // Mark attendance for students
      if (!isTeacher) {
        await markAttendance()
      }
      
      // Show the Jitsi component
      setShowMeeting(true)
      
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Failed to join video conference')
    } finally {
      setJoining(false)
    }
  }
  
  // Handle meeting joined event
  const handleMeetingJoined = () => {
    setHasJoined(true)
    
    // Different messages based on role
    if (isTeacher) {
      toast.success('You have started the session as host')
    } else {
      toast.success('You have joined the meeting')
    }
  }
  
  // Handle meeting left event
  const handleMeetingLeft = () => {
    setHasJoined(false)
    setShowMeeting(false)
    
    // Different messages based on role
    if (isTeacher) {
      toast.info('You have ended the session')
    } else {
      toast.info('You have left the meeting')
    }
  }
  
  // Mark attendance when student joins session
  const markAttendance = async () => {
    try {
      // Only students should call this endpoint
      if (!isTeacher) {
        await attendanceService.markAttendance(id, { present: true })
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
    }
  }
  
  // Format date display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }
  
  // Get button text based on session status and user role
  const getActionButtonText = () => {
    if (isTeacher) {
      if (sessionStatus === 'live') {
        return startingSession ? 'Starting Session...' : 'Start Session';
      } else if (sessionStatus === 'teacher-ready') {
        return startingSession ? 'Starting Session Early...' : 'Start Session Early';
      } else if (sessionStatus === 'upcoming') {
        return `Start Session Early (${timeLeft} until scheduled time)`;
      } else {
        return 'Session Ended';
      }
    } else {
      // For students
      if (sessionStatus === 'live') {
        return joining ? 'Joining...' : 'Join Session';
      } else if (sessionStatus === 'student-ready') {
        return `Join Session (Starts in ${timeLeft})`;
      } else if (sessionStatus === 'upcoming') {
        return `Waiting for Teacher (Available in ${timeLeft})`;
      } else {
        return 'Session Ended';
      }
    }
  };
  
  // Get status label for display
  const getStatusLabel = () => {
    switch (sessionStatus) {
      case 'live':
        return isTeacher ? 'Active (Can Start Now)' : 'Active';
      case 'teacher-ready':
        return isTeacher ? 'Ready to Start Early' : 'Starting Soon';
      case 'student-ready':
        return 'Starting Soon';
      case 'upcoming':
        return isTeacher ? 'Can Start Early' : 'Upcoming';
      case 'ended':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };
  
  // Get status color
  const getStatusColor = () => {
    switch (sessionStatus) {
      case 'live':
        return 'green';
      case 'teacher-ready':
      case 'student-ready':
        return 'yellow';
      case 'upcoming':
        return 'blue';
      case 'ended':
        return 'gray';
      default:
        return 'gray';
    }
  };
  
  // Handle completing a session (for teachers)
  const handleCompleteSession = async () => {
    if (!isTeacher || sessionStatus !== 'live') return;
    
    try {
      setLoading(true);
      
      // Call API to mark session as completed
      await sessionService.completeSession(id);
      
      toast.success('Session marked as completed');
      
      // Update session status
      setSessionStatus('ended');
      setIsActive(false);
      
      // End the Jitsi meeting if it's open
      if (showMeeting) {
        if (sessionApiRef.current) {
          sessionApiRef.current.executeCommand('hangup');
        }
        setShowMeeting(false);
      }
      
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual refresh of session status
  const handleRefreshStatus = () => {
    updateSessionStatus();
    toast.info('Session status updated');
  };
  
  // Store the Jitsi API reference passed from the JitsiMeet component
  const handleApiReference = (api) => {
    sessionApiRef.current = api;
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (!session) {
    return (
      <div className="text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Session not found.
        </p>
        <Button to="/sessions" variant="primary" className="mt-4">
          Back to Sessions
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Navigation and actions bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            to="/sessions" 
            variant="ghost" 
            size="sm"
            icon={<BiArrowBack className="h-5 w-5" />}
          >
            Back to Sessions
          </Button>
        </div>
        
        {isTeacher && (
          <div className="flex items-center gap-2">
            <Button 
              to={`/sessions/${id}/edit`} 
              variant="outline" 
              icon={<BiEdit className="h-5 w-5" />}
              disabled={sessionStatus === 'live' || sessionStatus === 'ended'}
            >
              Edit Session
            </Button>
            {!deleteConfirm ? (
              <Button 
                variant="danger" 
                icon={<BiTrash className="h-5 w-5" />}
                onClick={() => setDeleteConfirm(true)}
                disabled={sessionStatus === 'live'}
              >
                Delete
              </Button>
            ) : (
              <>
                <Button 
                  variant="danger" 
                  onClick={handleDeleteSession}
                >
                  Confirm Delete
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Session header */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{session.title}</h1>
          
          {sessionStatus && (
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium
              ${getStatusColor() === 'green' ? 'bg-green-100 text-green-800' : 
                getStatusColor() === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                getStatusColor() === 'blue' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
              {getStatusLabel()}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
          <span className="flex items-center gap-1">
            <BiCalendar className="h-5 w-5" />
            {formatDate(session.startTime)}
          </span>
          <span className="flex items-center gap-1">
            <BiTime className="h-5 w-5" />
            {formatDate(session.endTime)}
          </span>
          {session.course && (
            <span className="flex items-center gap-1">
              <BiBook className="h-5 w-5" />
              {typeof session.course === 'object' ? session.course.title : session.course}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Session details and video conference */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video conference component */}
          <Card>
            <Card.Header className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <BiVideo className="h-6 w-6 text-primary-500" />
                <h2 className="text-xl font-semibold">Video Conference</h2>
              </div>
              
              {!showMeeting && (
                <Button
                  variant={isTeacher ? "primary" : (sessionStatus === 'live' ? "primary" : "secondary")}
                  size="md"
                  onClick={isTeacher ? handleStartSession : handleJoinSession}
                  disabled={(isTeacher ? startingSession : joining) || 
                            (sessionStatus === 'ended' || (sessionStatus === 'upcoming' && !isTeacher))}
                  icon={isTeacher ? <BiPlay className="h-5 w-5 mr-2" /> : <BiVideo className="h-5 w-5 mr-2" />}
                >
                  {isTeacher && startingSession || !isTeacher && joining ? (
                    <Spinner size="sm" className="mr-2" /> 
                  ) : null}
                  {getActionButtonText()}
                </Button>
              )}
            </Card.Header>
            
            <Card.Body>
              {showMeeting ? (
                <JitsiMeet 
                  roomName={`vclass-${session._id}`}
                  displayName={user.name}
                  email={user.email}
                  isTeacher={isTeacher}
                  onMeetingJoined={handleMeetingJoined}
                  onMeetingLeft={handleMeetingLeft}
                  onApiReady={handleApiReference}
                />
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg bg-gray-100 p-8 text-center dark:bg-gray-800">
                  <BiVideo className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    {isTeacher ? 'Video Conference' : 'Join Video Conference'}
                  </h3>
                  
                  {sessionStatus === 'live' && (
                    <p className="mt-2 text-sm text-green-500 font-medium">
                      {isTeacher 
                        ? "You can start this session now" 
                        : "Session is active and ready to join"}
                    </p>
                  )}
                  
                  {sessionStatus === 'teacher-ready' && (
                    <p className="mt-2 text-sm text-amber-500">
                      {isTeacher 
                        ? "You can start the session early (15 minutes before scheduled time)" 
                        : "The session will be available soon"}
                    </p>
                  )}
                  
                  {sessionStatus === 'student-ready' && (
                    <p className="mt-2 text-sm text-amber-500">
                      {isTeacher 
                        ? "You can start the session now" 
                        : "The session will begin shortly"}
                    </p>
                  )}
                  
                  {sessionStatus === 'upcoming' && (
                    <p className="mt-2 text-sm text-blue-500">
                      {isTeacher 
                        ? `Session is scheduled to start in ${timeLeft}` 
                        : `This session will be available in ${timeLeft}`}
                    </p>
                  )}
                  
                  {sessionStatus === 'ended' && (
                    <p className="mt-2 text-sm text-gray-500">
                      This session has ended
                    </p>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* Description */}
          {session.description && (
            <Card>
              <Card.Header className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Description</h2>
              </Card.Header>
              <Card.Body>
                <p className="whitespace-pre-line">{session.description}</p>
              </Card.Body>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Session Info */}
          <Card>
            <Card.Header className="border-b border-gray-200 pb-4 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Session Info</h2>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                <button 
                  onClick={handleRefreshStatus} 
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  title="Refresh status"
                >
                  <BiRefresh className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-1">
                {sessionStatus === 'live' ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                ) : sessionStatus === 'ended' ? (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Completed
                  </span>
                ) : sessionStatus === 'teacher-ready' || sessionStatus === 'student-ready' ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Starting Soon
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Upcoming
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</h3>
                <p className="mt-1 flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <BiCalendar className="mr-2 h-4 w-4 text-gray-500" />
                  {new Date(session.startTime).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</h3>
                <p className="mt-1 flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <BiTime className="mr-2 h-4 w-4 text-gray-500" />
                  {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                </p>
              </div>
              
              {isTeacher && sessionStatus === 'live' && (
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    icon={<BiListCheck className="h-5 w-5" />}
                    to={`/attendance?sessionId=${id}`}
                  >
                    View Attendance
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full" 
                    icon={<BiCheck className="h-5 w-5" />}
                    onClick={handleCompleteSession}
                  >
                    Complete Session
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* Teacher Information */}
          {session.course && session.course.teacher && (
            <Card>
              <Card.Header className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Instructor</h2>
              </Card.Header>
              <Card.Body>
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700">
                    <BiUser className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {typeof session.course.teacher === 'object' 
                        ? session.course.teacher.name 
                        : 'Instructor'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {typeof session.course.teacher === 'object' && session.course.teacher.email 
                        ? session.course.teacher.email 
                        : ''}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionDetail 