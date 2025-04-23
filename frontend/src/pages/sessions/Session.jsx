import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BiArrowBack, BiEdit, BiVideo, BiCalendar, BiTime, BiBookOpen, BiUser, BiLinkExternal } from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import sessionService from '../../services/sessionService'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

const Session = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'
  
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)
  
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true)
        
        // Check if ID is valid before making API call
        if (!id) {
          setError('Invalid session ID')
          return
        }
        
        const data = await sessionService.getSessionById(id)
        setSession(data)
      } catch (error) {
        console.error('Error fetching session:', error)
        setError('Failed to load session details. It may have been deleted or you do not have permission to view it.')
        toast.error('Failed to load session details')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSession()
  }, [id])
  
  // Calculate session status
  const getSessionStatus = () => {
    if (!session) return null
    
    const now = new Date()
    const startTime = new Date(session.startTime)
    const endTime = new Date(session.endTime)
    
    if (now < startTime) {
      return { status: 'upcoming', label: 'Upcoming', color: 'blue' }
    } else if (now >= startTime && now <= endTime) {
      return { status: 'active', label: 'Live', color: 'green' }
    } else {
      return { status: 'ended', label: 'Ended', color: 'gray' }
    }
  }
  
  const sessionStatus = getSessionStatus()
  
  // Handle joining session
  const handleJoinSession = async () => {
    try {
      setJoining(true)
      
      // Navigate to the session detail page where the Jitsi component is embedded
      navigate(`/sessions/${session._id}/detail`)
      
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Failed to join session')
      setJoining(false)
    }
  }
  
  // Calculate if session can be joined
  const canJoinSession = () => {
    if (!session) return false;
    
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    
    // Teachers can join/start 15 minutes early and anytime during the session window
    if (isTeacher) {
      const teacherJoinBuffer = new Date(startTime);
      teacherJoinBuffer.setMinutes(teacherJoinBuffer.getMinutes() - 15);
      return now >= teacherJoinBuffer && now <= endTime;
    } else {
      // Students can only join 5 minutes before start time and during the session
      const studentJoinBuffer = new Date(startTime);
      studentJoinBuffer.setMinutes(studentJoinBuffer.getMinutes() - 5);
      return now >= studentJoinBuffer && now <= endTime;
    }
  };
  
  // Format duration in hours and minutes
  const formatDuration = () => {
    if (!session) return ''
    
    const start = new Date(session.startTime)
    const end = new Date(session.endTime)
    const diffMs = end - start
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHrs === 0) {
      return `${diffMins} minutes`
    } else if (diffMins === 0) {
      return `${diffHrs} hour${diffHrs > 1 ? 's' : ''}`
    } else {
      return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ${diffMins} minutes`
    }
  }
  
  // Format how long before the session start time joining is allowed
  const formatTimeToStart = () => {
    return isTeacher ? '15 minutes' : '5 minutes';
  }
  
  // Add a helper function to format the join time message
  const getJoinTimeMessage = () => {
    const startTime = new Date(session.startTime);
    
    if (isTeacher) {
      return `You can start this session 15 minutes before the scheduled time (${format(startTime, 'h:mm a')}).`;
    } else {
      return `This session will be available to join 5 minutes before the start time (${format(startTime, 'h:mm a')}).`;
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (error) {
    return (
      <Card>
        <Card.Body>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900 dark:text-red-200">
              <BiVideo className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Session Not Found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Button to="/sessions" variant="outline" className="mt-4" icon={<BiArrowBack className="h-5 w-5" />}>
              Back to Sessions
            </Button>
          </div>
        </Card.Body>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost" 
          to="/sessions"
          icon={<BiArrowBack className="h-5 w-5" />}
          size="sm"
        >
          Back to Sessions
        </Button>
        
        {sessionStatus && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium 
              ${
                sessionStatus.color === 'green'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : sessionStatus.color === 'blue'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
          >
            {sessionStatus.label}
          </span>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <Card.Body>
              <div className="flex justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{session.title}</h1>
                
                {isTeacher && (
                  <Button
                    variant="ghost"
                    to={`/sessions/edit/${session._id}`}
                    icon={<BiEdit className="h-5 w-5" />}
                    size="sm"
                  >
                    Edit
                  </Button>
                )}
              </div>
              
              {session.description && (
                <div className="mt-4 text-gray-700 dark:text-gray-300">
                  <p>{session.description}</p>
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* Meeting resources */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium">Meeting Details</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {canJoinSession() ? (
                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleJoinSession}
                      icon={<BiVideo className="h-5 w-5" />}
                      className="w-full sm:w-auto"
                      disabled={joining}
                    >
                      {joining ? <Spinner size="sm" className="mr-2" /> : null}
                      Join Session Now
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="rounded-md bg-gray-100 p-4 text-center dark:bg-gray-800">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date() < new Date(session.startTime) 
                          ? getJoinTimeMessage()
                          : 'This session has ended and is no longer available to join.'}
                      </p>
                    </div>
                  </div>
                )}
                
                {session.meetingUrl && (
                  <div className="flex items-center rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700">
                    <BiLinkExternal className="h-5 w-5 text-gray-500" />
                    <div className="ml-3">
                      <span className="block font-medium text-gray-700 dark:text-gray-200">External Meeting Link:</span>
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {session.meetingUrl}
                      </a>
                    </div>
                  </div>
                )}
                
                {session.materials && session.materials.length > 0 && (
                  <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                    <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-200">Session Materials</h3>
                    <ul className="space-y-2">
                      {session.materials.map((material, index) => (
                        <li key={index}>
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <span className="mr-2">{material.name}</span>
                            <BiLinkExternal className="h-4 w-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {sessionStatus && sessionStatus.status === 'ended' && session.recordingUrl && (
                  <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                    <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-200">Session Recording</h3>
                    <a
                      href={session.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      <span className="mr-2">Watch Recording</span>
                      <BiLinkExternal className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium">Session Information</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-start">
                  <BiCalendar className="h-5 w-5 text-gray-500" />
                  <div className="ml-3">
                    <span className="block font-medium text-gray-700 dark:text-gray-200">Date:</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {format(new Date(session.startTime), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <BiTime className="h-5 w-5 text-gray-500" />
                  <div className="ml-3">
                    <span className="block font-medium text-gray-700 dark:text-gray-200">Time:</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                      <span className="block mt-1 text-sm">(Duration: {formatDuration()})</span>
                    </span>
                  </div>
                </div>
                
                {session.course && (
                  <div className="flex items-start">
                    <BiBookOpen className="h-5 w-5 text-gray-500" />
                    <div className="ml-3">
                      <span className="block font-medium text-gray-700 dark:text-gray-200">Course:</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {session.course.title || session.course.name}
                        {session.course.subject && <span className="block text-sm">{session.course.subject}</span>}
                      </span>
                    </div>
                  </div>
                )}
                
                {session.instructor && (
                  <div className="flex items-start">
                    <BiUser className="h-5 w-5 text-gray-500" />
                    <div className="ml-3">
                      <span className="block font-medium text-gray-700 dark:text-gray-200">Instructor:</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {session.instructor.firstName} {session.instructor.lastName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {/* Maybe add participant list here if needed */}
        </div>
      </div>
    </div>
  )
}

export default Session 