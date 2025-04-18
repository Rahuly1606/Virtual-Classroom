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
  BiListCheck
} from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
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
  const [session, setSession] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const jitsiContainerRef = useRef(null)
  const jitsiApiRef = useRef(null)
  
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
        
        // Check if the session is active
        const now = new Date()
        const startTime = new Date(sessionData.startTime)
        const endTime = new Date(sessionData.endTime)
        setIsActive(now >= startTime && now <= endTime)
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
  
  // Clean up Jitsi on unmount
  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
        jitsiApiRef.current = null
      }
    }
  }, [])
  
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
  
  // Handle joining video session
  const handleJoinSession = async () => {
    if (!isActive) {
      toast.warning('This session is not currently active')
      return
    }
    
    try {
      setJoining(true)
      
      // Initialize Jitsi Meet if not already done
      if (!jitsiApiRef.current && jitsiContainerRef.current) {
        // Make sure Jitsi is loaded
        if (!window.JitsiMeetExternalAPI) {
          await loadJitsiScript()
        }
        
        const domain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si'
        const options = {
          roomName: `vclass-${session._id}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: user.name,
            email: user.email
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'select-background', 'download', 'help', 'mute-everyone'
            ]
          }
        }
        
        // Create Jitsi Meet API instance
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options)
        
        // Add event listeners
        jitsiApiRef.current.addEventListeners({
          videoConferenceJoined: () => {
            setHasJoined(true)
            
            // Mark attendance for students
            if (!isTeacher) {
              markAttendance()
            }
          },
          videoConferenceLeft: () => {
            setHasJoined(false)
          }
        })
      }
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Failed to join video conference')
    } finally {
      setJoining(false)
    }
  }
  
  // Load Jitsi Meet API script
  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = (e) => reject(e)
      document.body.appendChild(script)
    })
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
            >
              Edit Session
            </Button>
            {!deleteConfirm ? (
              <Button 
                variant="danger" 
                icon={<BiTrash className="h-5 w-5" />}
                onClick={() => setDeleteConfirm(true)}
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
        <h1 className="text-3xl font-bold">{session.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
          <span className="flex items-center gap-1">
            <BiCalendar className="h-5 w-5" />
            {formatDate(session.startTime)}
          </span>
          <span className="flex items-center gap-1">
            <BiTime className="h-5 w-5" />
            {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
          </span>
          {session.course && (
            <span className="flex items-center gap-1">
              <BiBook className="h-5 w-5" />
              {session.course.name}
            </span>
          )}
          {session.instructor && (
            <span className="flex items-center gap-1">
              <BiUser className="h-5 w-5" />
              {session.instructor.name}
            </span>
          )}
        </div>
      </div>
      
      {/* Session details and video conference */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Session info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <Card.Body>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Session Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="mt-1 text-gray-900 dark:text-gray-100 whitespace-pre-line">
                    {session.description || 'No description available.'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                  <div className="mt-1">
                    {isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    ) : new Date(session.startTime) > new Date() ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Upcoming
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Ended
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {isTeacher && (
                <div className="mt-6">
                  <Button
                    to={`/attendance?sessionId=${id}`}
                    variant="outline"
                    fullWidth
                    icon={<BiListCheck className="h-5 w-5" />}
                  >
                    View Attendance
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* Recordings (if session has ended) */}
          {new Date(session.endTime) < new Date() && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recordings</h2>
              </Card.Header>
              <Card.Body>
                {session.recordings && session.recordings.length > 0 ? (
                  <ul className="space-y-2">
                    {session.recordings.map((recording, index) => (
                      <li key={index}>
                        <a 
                          href={recording.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          Recording {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No recordings available.
                  </p>
                )}
              </Card.Body>
            </Card>
          )}
        </div>
        
        {/* Video conference area */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {isActive ? (
              <>
                <Card.Header className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <BiVideo className="mr-2 h-5 w-5" />
                      Video Conference
                    </h2>
                    {!hasJoined && (
                      <Button
                        variant="primary"
                        onClick={handleJoinSession}
                        loading={joining}
                      >
                        Join Meeting
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800">
                  {hasJoined ? (
                    <div ref={jitsiContainerRef} className="h-full w-full" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <BiVideo className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" />
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                          Click "Join Meeting" to start the video conference
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : new Date(session.startTime) > new Date() ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <BiCalendar className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Session hasn't started yet
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  This session will begin on {formatDate(session.startTime)}
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/sessions')}
                  >
                    Back to Sessions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <BiTime className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Session has ended
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  This session ended on {formatDate(session.endTime)}
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/sessions')}
                  >
                    Back to Sessions
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SessionDetail 