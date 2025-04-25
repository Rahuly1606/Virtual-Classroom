import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BiArrowBack, BiVideo, BiUserCheck, BiTime, BiExit } from 'react-icons/bi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EnhancedJitsiMeet from '../../components/EnhancedJitsiMeet';
import { useLiveClass } from '../../context/LiveClassContext';
import useAuth from '../../hooks/useAuth';
import sessionService from '../../services/sessionService';

const LiveClass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    startSession, 
    joinSession, 
    endSession, 
    leaveSession,
    activeSession,
    joinLink,
    participants,
    isLoading,
    error,
    isTeacher
  } = useLiveClass();
  
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [roomName, setRoomName] = useState('');
  
  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoadingSession(true);
        const sessionData = await sessionService.getSessionById(id);
        setSession(sessionData);
        
        // Extract room name from video link if available
        if (sessionData.videoLink && sessionData.meetingId) {
          setRoomName(sessionData.meetingId);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        toast.error('Failed to load session details');
      } finally {
        setLoadingSession(false);
      }
    };
    
    fetchSession();
  }, [id]);
  
  // Handle joining or starting the session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        if (!session) return;
        
        let sessionData;
        let extractedRoom = '';
        
        if (isTeacher) {
          try {
            sessionData = await startSession(id);
            console.log('Teacher starting session, got data:', sessionData);
          } catch (error) {
            console.error('Error starting session:', error);
          }
        } else {
          try {
            sessionData = await joinSession(id);
            console.log('Student joining session, got data:', sessionData);
          } catch (error) {
            console.error('Error joining session:', error);
          }
        }
        
        // Check if we have session data with a video link
        if (sessionData && sessionData.videoLink) {
          // Extract room name from the URL
          try {
            // Try parsing as a URL first
            const url = new URL(sessionData.videoLink);
            extractedRoom = url.pathname.replace('/', '');
            console.log('Extracted room name from URL:', extractedRoom);
          } catch (e) {
            console.warn('URL parsing failed, trying simpler extraction:', e);
            // Fallback to simpler extraction if URL parsing fails
            const urlParts = sessionData.videoLink.split('/');
            extractedRoom = urlParts[urlParts.length - 1];
            console.log('Extracted room name from string split:', extractedRoom);
          }
          
          // Fallback to meetingId if extraction failed
          if (!extractedRoom && sessionData.meetingId) {
            extractedRoom = sessionData.meetingId;
            console.log('Using meetingId as room name:', extractedRoom);
          }
        } else {
          // If we don't have session data, try to get room name from session.meetingId
          console.warn('No session data with videoLink returned');
          if (session.meetingId) {
            extractedRoom = session.meetingId;
            console.log('Using session.meetingId as room name:', extractedRoom);
          }
        }
        
        // If we still don't have a room name, generate a fallback that won't trigger lobby
        if (!extractedRoom) {
          // Create a safe format room name that won't trigger special behavior
          const timestamp = Date.now().toString(36);
          const randomStr = Math.random().toString(36).substring(2, 7);
          const sessionIdPart = id.substring(0, 5).replace(/[^a-zA-Z0-9]/g, '');
          extractedRoom = `room_${sessionIdPart}_${timestamp}_${randomStr}`;
          console.log('Generated fallback room name:', extractedRoom);
        }
        
        // Make sure the room name has no spaces, special chars, and doesn't start with problematic prefixes
        extractedRoom = extractedRoom.replace(/[^a-zA-Z0-9_-]/g, '_');
        
        // Avoid room names that tend to cause issues
        if (extractedRoom.startsWith('emergency') || extractedRoom.startsWith('class_') || 
            extractedRoom.includes('@lobby') || extractedRoom.includes('lobby')) {
          // Create a guaranteed safe room name
          const timestamp = Date.now().toString(36);
          const randomStr = Math.random().toString(36).substring(2, 7);
          extractedRoom = `videoroom_${timestamp}_${randomStr}`;
        }
        
        console.log('Final room name (sanitized):', extractedRoom);
        
        setRoomName(extractedRoom);
      } catch (error) {
        console.error('Error initializing session:', error);
        toast.error('Failed to join or start the live class: ' + (error.message || ''));
        
        // Even on error, try to set a room name as a last resort, avoiding problematic prefixes
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 7);
        const safeRoom = `videoroom_${timestamp}_${randomStr}`;
        console.log('Setting safe room name due to error:', safeRoom);
        setRoomName(safeRoom);
      }
    };
    
    if (session && !activeSession) {
      initializeSession();
    }
  }, [session, id, isTeacher, activeSession]);

  // Handle meeting joined event
  const handleMeetingJoined = () => {
    toast.success(`You have ${isTeacher ? 'started' : 'joined'} the live class`);
  };

  // Generate and set a random room name if needed
  const ensureRoomName = () => {
    if (!roomName) {
      const fallbackName = `classroom_${id.substring(0,8)}_${Date.now().toString(36)}`;
      console.log('Using fallback room name:', fallbackName);
      setRoomName(fallbackName);
      return fallbackName;
    }
    return roomName;
  };

  // Use a room name even if we don't have one yet
  const getEffectiveRoomName = () => {
    return roomName || `classroom_${id.substring(0,8)}_${Math.floor(Math.random() * 10000)}`;
  };

  // Handle meeting left event
  const handleMeetingLeft = () => {
    if (isTeacher) {
      endSession(id, true);
      toast.info('You have ended the live class');
    } else {
      leaveSession();
      toast.info('You have left the live class');
    }
    navigate(`/sessions/${id}`);
  };
  
  // Format session duration
  const formatDuration = () => {
    if (!session) return '';
    
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs === 0) {
      return `${diffMins} minutes`;
    } else if (diffMins === 0) {
      return `${diffHrs} hour${diffHrs > 1 ? 's' : ''}`;
    } else {
      return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ${diffMins} minutes`;
    }
  };
  
  // Handle manual exit
  const handleExit = () => {
    if (isTeacher) {
      // Show confirmation for teachers
      if (window.confirm('Are you sure you want to end the live class for all participants?')) {
        endSession(id, true);
        navigate(`/sessions/${id}`);
      }
    } else {
      leaveSession();
      navigate(`/sessions/${id}`);
    }
  };

  if (loadingSession || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900 dark:text-red-200">
              <BiVideo className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Button to={`/sessions/${id}`} variant="outline" className="mt-4" icon={<BiArrowBack />}>
              Back to Session
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isTeacher ? 'Teaching Live Class' : 'Attending Live Class'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {session?.title} • {formatDuration()}
          </p>
        </div>
        
        <div className="mt-3 sm:mt-0">
          <Button 
            onClick={handleExit}
            variant="danger"
            icon={<BiExit />}
            size="sm"
          >
            {isTeacher ? 'End Class' : 'Leave Class'}
          </Button>
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Video container */}
        <div className="lg:col-span-9">
          <Card>
            <Card.Body className="p-0">
              {roomName ? (
                <EnhancedJitsiMeet
                  roomName={roomName}
                  onMeetingJoined={handleMeetingJoined}
                  onMeetingLeft={handleMeetingLeft}
                  className="min-h-[600px]"
                />
              ) : (
                <div className="flex h-64 items-center justify-center flex-col">
                  <Spinner size="lg" />
                  <div className="text-center mt-4 space-y-2">
                    <p className="text-gray-700 dark:text-gray-300">Setting up meeting room...</p>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="mx-auto"
                        onClick={() => {
                          const newRoomName = ensureRoomName();
                          toast.info(`Creating fallback meeting room: ${newRoomName}`);
                        }}
                      >
                        Create Fallback Room
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mx-auto mt-2"
                        onClick={() => {
                          // Create a random room name that's guaranteed not to use lobby
                          const timestamp = Date.now().toString(36);
                          const randomStr = Math.random().toString(36).substring(2, 8);
                          const directRoom = `directroom_${timestamp}_${randomStr}`;
                          const jitsiUrl = `https://meet.jit.si/${directRoom}`;
                          
                          // Open in new tab
                          window.open(jitsiUrl, '_blank');
                          
                          toast.info("Opened direct Jitsi link in new tab");
                        }}
                      >
                        Open Direct Jitsi Link
                      </Button>
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-4">
                        Seeing "Waiting for authentication" message?
                        <Button
                          variant="danger"
                          size="xs"
                          className="mx-auto mt-2 whitespace-nowrap"
                          onClick={() => {
                            // Create a direct iframe embedding
                            const container = document.querySelector('#jitsiContainer');
                            if (container) {
                              // Clear container
                              container.innerHTML = '';
                              
                              // Generate room name
                              const timestamp = Date.now().toString(36);
                              const randomStr = Math.random().toString(36).substring(2, 8);
                              const directRoom = `emerg_${timestamp}_${randomStr}`;
                              
                              // Create iframe
                              const iframe = document.createElement('iframe');
                              iframe.src = `https://meet.jit.si/${directRoom}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.enableLobby=false&config.membersOnly=false&config.waitForOwner=false&config.authenticationEnabled=false&userInfo.role=moderator`;
                              iframe.width = '100%';
                              iframe.height = '100%';
                              iframe.allow = 'camera; microphone; fullscreen; display-capture; autoplay; clipboard-write';
                              iframe.style.border = 'none';
                              iframe.style.minHeight = '500px';
                              
                              // Add to container
                              container.appendChild(iframe);
                              container.style.visibility = 'visible';
                              
                              toast.success("Using emergency mode to bypass authentication");
                            }
                          }}
                        >
                          Bypass Authentication
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Participants */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Participants</h2>
                <span className="badge badge-primary rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {participants.length}
                </span>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="max-h-48 overflow-y-auto">
                {participants.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No participants yet
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {participants.map((participant) => (
                      <li key={participant.id} className="flex items-center py-3 px-4">
                        <BiUserCheck className="mr-2 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {participant.displayName || 'Unnamed participant'}
                          {participant.isTeacher && (
                            <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Teacher
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {/* Session Controls - Teacher Only */}
          {isTeacher && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-medium">Class Controls</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Teacher controls are available in the Jitsi interface:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-center">
                      <span className="mr-2 rounded-full bg-blue-100 p-1 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                        <BiUserCheck className="h-4 w-4" />
                      </span>
                      Mute all students in menu
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 rounded-full bg-blue-100 p-1 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                        <BiVideo className="h-4 w-4" />
                      </span>
                      Spotlight your video
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 rounded-full bg-blue-100 p-1 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                        <BiTime className="h-4 w-4" />
                      </span>
                      Auto-end after inactivity
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/sessions/${id}`)}
                    icon={<BiArrowBack />}
                  >
                    Back to Session
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
          
          {/* Student info */}
          {!isTeacher && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-medium">Class Information</h2>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This live class is in progress. Your attendance is being recorded.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => navigate(`/sessions/${id}`)}
                  icon={<BiArrowBack />}
                >
                  Back to Session
                </Button>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClass; 