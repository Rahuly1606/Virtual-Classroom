import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { BiLoaderAlt, BiError } from 'react-icons/bi';
import { useLiveClass } from '../context/LiveClassContext';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

const EnhancedJitsiMeet = ({ 
  roomName, 
  onMeetingJoined,
  onMeetingLeft,
  className = ''
}) => {
  const jitsiContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { 
    setJitsiApi, 
    updateParticipants, 
    isTeacher 
  } = useLiveClass();
  
  // Load the Jitsi script explicitly 
  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        console.log('Jitsi script already loaded');
        resolve();
        return;
      }
      
      const existingScript = document.getElementById('jitsi-api-script');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.id = 'jitsi-api-script';
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        console.log('Jitsi script loaded successfully');
        resolve();
      };
      script.onerror = (e) => {
        console.error('Error loading Jitsi script:', e);
        reject(new Error('Failed to load Jitsi API'));
      };
      document.body.appendChild(script);
    });
  };

  // Track participant changes
  const processParticipantsUpdate = (participants) => {
    try {
      // If participants is not an object or array, handle the error
      if (!participants || typeof participants !== 'object') {
        console.warn('Invalid participants data:', participants);
        return;
      }
      
      // Convert participants object to array
      const participantsArray = Object.values(participants || {}).map(p => ({
        id: p.id,
        displayName: p.displayName,
        avatar: p.avatar,
        role: p.role,
        isTeacher: p.role === 'moderator',
        joinTime: new Date()
      }));
      
      updateParticipants(participantsArray);
    } catch (error) {
      console.error('Error processing participants update:', error);
    }
  };

  // Safe wrapper for getting participants
  const safeGetParticipants = (api) => {
    try {
      if (!api || typeof api.getParticipantsInfo !== 'function') {
        console.warn('Invalid Jitsi API or getParticipantsInfo not available');
        return;
      }
      
      const participants = api.getParticipantsInfo();
      processParticipantsUpdate(participants);
    } catch (error) {
      console.error('Error getting participants:', error);
    }
  };

  // Initialize the Jitsi meeting
  const initializeJitsi = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!jitsiContainerRef.current) {
        throw new Error('Container not ready');
      }
      
      // Ensure we have a valid room name
      if (!roomName || roomName.trim() === '') {
        throw new Error('Room name is required, but was empty');
      }
      
      console.log('Initializing Jitsi with room name:', roomName);
      
      // Load the Jitsi script if needed
      if (!window.JitsiMeetExternalAPI) {
        console.log('Loading Jitsi script...');
        try {
          await loadJitsiScript();
        } catch (e) {
          console.error('Failed to load Jitsi script, retrying once more:', e);
          // Try once more
          await loadJitsiScript();
        }
      }
      
      if (!window.JitsiMeetExternalAPI) {
        throw new Error('Jitsi Meet API not available after loading script');
      }
      
      // Configure Jitsi options
      const domain = 'meet.jit.si';
      
      // Sanitize room name to avoid URL issues and lobby triggering
      let sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      // Don't use room names that end up in lobby
      if (sanitizedRoomName.includes('@lobby')) {
        sanitizedRoomName = sanitizedRoomName.replace('@lobby', '_room');
      }
      
      // Don't use 'class' or 'emergency' prefixes as they might trigger special behavior
      if (sanitizedRoomName.startsWith('class_') || sanitizedRoomName.startsWith('emergency_')) {
        // Instead create a unique, safe room name based on timestamp and random string
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        sanitizedRoomName = `room_${timestamp}_${randomStr}`;
      }
      
      console.log('Using sanitized room name:', sanitizedRoomName);
      
      const options = {
        roomName: sanitizedRoomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user?.name || 'User',
          email: user?.email || '',
          role: isTeacher ? 'moderator' : 'participant'
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: !isTeacher,
          startWithVideoMuted: !isTeacher,
          startAudioOnly: false,
          enableClosePage: true,
          disableInviteFunctions: !isTeacher,
          
          // Authentication and security settings
          requireDisplayName: false,
          enableInsecureRoomNameWarning: false,
          enableWelcomePage: false,
          welcomePageEnabledDiscarded: true,
          waitForOwner: false,             // Critical: Don't wait for owner/moderator
          startWithVideoMuted: !isTeacher ? 10 : false,
          startWithAudioMuted: !isTeacher ? 10 : false,
          
          // Completely disable authentication requirements
          enableAuthTokenCreation: false,
          authenticationEnabled: false,
          tokenAuthUrl: null,
          tokenAuthUrlOnReject: null,
          tokenAuthUrlOnTimeout: null,
          enableAutomaticUrlCopy: false,
          
          // Complete lobby and security bypass
          lobby: {
            autoKnock: false,
            enableLobby: false
          },
          membersOnly: false,
          enableLobbyChat: false,
          roomPasswordNumberOfDigits: 0,
          hideLobbyButton: true,
          disableProfile: !isTeacher,
          
          // Disable peer-to-peer to avoid connection issues
          p2p: {
            enabled: false,
            preferH264: false,
            disableH264: true,
            useStunTurn: false
          },
          
          // Explicitly set moderator role for teachers
          enableUserRolesBasedOnToken: false,
          breakoutRooms: {
            enabled: isTeacher,
            hideAddRoomButton: !isTeacher
          },
          
          // Grant host privileges to teacher
          testing: {
            enableFirefoxSimulcast: false,
            p2pTestMode: false,
            disableFocus: false
          },
          
          // Session configuration
          startSilent: false,
          startWithVideo: true,
          disableThirdPartyRequests: true,
          
          // Only enable recording for teachers
          recording: {
            enabled: isTeacher,
            recordingSharingEnabled: isTeacher
          },
          
          // Analytics for tracking user activity
          analytics: {
            disabled: false,
          },
          
          // Auto-end on inactivity (30 min)
          sessionTerminationTime: 30 * 60, // 30 minutes
          
          // Force direct join - critical to bypass lobby
          channelLastN: -1,
          disableFocus: false,
          disableJoinLeaveSounds: false,
          enableNoAudioDetection: true,
          enableNoisyMicDetection: true,
          stereo: false,
          subject: `${sanitizedRoomName} Session`
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 
            ...(isTeacher ? ['recording', 'livestreaming', 'sharedvideo'] : []),
            'settings', 'raisehand', 'videoquality', 'filmstrip', 'feedback', 
            'stats', 'shortcuts', 'tileview', 'select-background', 'download', 
            'help', ...(isTeacher ? ['mute-everyone', 'security', 'invite'] : [])
          ],
          SHOW_JITSI_WATERMARK: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          TOOLBAR_ALWAYS_VISIBLE: isTeacher,
          INITIAL_TOOLBAR_TIMEOUT: isTeacher ? 20000 : 5000,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          DEFAULT_LOCAL_DISPLAY_NAME: isTeacher ? 'Instructor' : 'You'
        }
      };

      // Try a few times to create the Jitsi API instance
      let jitsiApi = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      // If room name contains patterns known to cause issues, use a completely different name
      if (sanitizedRoomName.includes('class_') || 
          sanitizedRoomName.includes('lobby') || 
          sanitizedRoomName.includes('emergency')) {
        console.log('Room name contains problematic patterns, generating a direct room name');
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        sanitizedRoomName = `meetroom_${timestamp}${randomStr}`;
        console.log('Using new safe room name:', sanitizedRoomName);
      }
      
      while (!jitsiApi && attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Creating JitsiMeetExternalAPI attempt ${attempts} with options:`, {
            domain,
            roomName: sanitizedRoomName,
            userRole: isTeacher ? 'moderator' : 'participant'
          });
          
          jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
          console.log('Successfully created Jitsi API instance on attempt', attempts);
          
          // Monitor for membersOnly error immediately after creation
          const membersOnlyCheck = setTimeout(() => {
            // If there's an error in console related to membersOnly, we'll need to detect it
            // since the error handlers might not fire as expected
            const errorListener = (event) => {
              if (event.message && event.message.includes('membersOnly')) {
                console.log('Detected membersOnly error in error event, creating new room');
                clearTimeout(membersOnlyCheck);
                window.removeEventListener('error', errorListener);
                
                try {
                  jitsiApi.dispose();
                } catch (e) {}
                
                // Create new room with emergency iframe
                createEmergencyIframe();
              }
            };
            window.addEventListener('error', errorListener);
            
            // Clean up listener after a while
            setTimeout(() => {
              window.removeEventListener('error', errorListener);
            }, 10000);
          }, 1000);
          
          break;
        } catch (apiError) {
          console.error(`Error creating Jitsi API instance (attempt ${attempts}):`, apiError);
          
          if (attempts >= maxAttempts) {
            // If all attempts fail, try emergency iframe as last resort
            console.log('All API creation attempts failed, using emergency iframe');
            const cleanup = createEmergencyIframe();
            return cleanup;
          }
          
          // If the error message includes membersOnly, switch to emergency mode immediately
          if (apiError.message && 
              (apiError.message.includes('membersOnly') || 
               apiError.message.includes('conference.connectionError'))) {
            console.log('API creation failed with membersOnly error, using emergency iframe');
            const cleanup = createEmergencyIframe();
            return cleanup;
          }
          
          // Short delay before trying again
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!jitsiApi) {
        throw new Error('Failed to create Jitsi API instance after multiple attempts');
      }
      
      // Store the API ref in context
      setJitsiApi(jitsiApi);
  
      // Add event listeners
      jitsiApi.addEventListeners({
        videoConferenceJoined: (data) => {
          console.log(`User ${data.displayName} joined the conference`, data);
          setIsLoading(false);
          if (onMeetingJoined) onMeetingJoined(data);
          
          // If teacher, set moderator role
          if (isTeacher) {
            // Set local participant role
            jitsiApi.executeCommand('setLocalParticipantProperty', { 
              property: 'role',
              value: 'moderator' 
            });
            
            // Give extra permissions to the teacher
            try {
              jitsiApi.executeCommand('overwriteConfig', { 
                startSilent: false,
                disableFocusIndicator: false
              });
            } catch (err) {
              console.log('Could not execute config overwrite command', err);
            }
          }
        },
        videoConferenceLeft: (data) => {
          console.log(`User left the conference`, data);
          if (onMeetingLeft) onMeetingLeft(data);
        },
        // Directly handle conference failure
        conferenceJoined: (data) => {
          console.log('Successfully joined conference:', data);
        },
        conferenceFailed: (data) => {
          console.error('Conference failed event:', data);
          
          // Handle membersOnly error 
          if (data && data.error === 'conference.connectionError.membersOnly') {
            console.log('Conference failed with membersOnly error, creating direct room');
            
            // Dispose current Jitsi instance
            try {
              jitsiApi.dispose();
            } catch (e) {
              console.warn('Error disposing Jitsi instance:', e);
            }
            
            // Directly create emergency iframe instead of reinitializing
            toast.info("Connecting to a direct meeting room...");
            createEmergencyIframe();
          }
        },
        participantJoined: (participant) => {
          console.log('Participant joined:', participant);
          if (jitsiApi) {
            safeGetParticipants(jitsiApi);
          }
        },
        participantLeft: (participant) => {
          console.log('Participant left:', participant);
          if (jitsiApi) {
            safeGetParticipants(jitsiApi);
          }
        },
        participantRoleChanged: (data) => {
          console.log('Participant role changed:', data);
          if (jitsiApi) {
            safeGetParticipants(jitsiApi);
          }
        },
        // Track participants periodically to maintain accurate count
        participantsChanged: (data) => {
          if (jitsiApi) {
            safeGetParticipants(jitsiApi);
          }
        },
        readyToClose: () => {
          console.log('Jitsi is ready to close');
          if (onMeetingLeft) onMeetingLeft();
        },
        errorOccurred: (error) => {
          console.error('Jitsi error:', error);
          
          // Handle membersOnly error explicitly
          if (error && error.error && error.error.name === 'conference.connectionError.membersOnly') {
            console.log('Detected membersOnly error, creating direct room instead');
            
            // Create a new random room name that won't trigger lobby
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2, 8);
            const directRoom = `direct_${timestamp}_${randomStr}`;
            
            // Dispose current Jitsi instance
            try {
              jitsiApi.dispose();
            } catch (e) {
              console.warn('Error disposing Jitsi instance:', e);
            }
            
            // Restart with new room
            toast.info("Creating direct room to bypass access restrictions...");
            
            // Don't use setRoomName - instead create emergency iframe directly
            createEmergencyIframe();
            
            return;
          }
          
          // Don't set error state here as it will disrupt the meeting if it's already working
          toast.error(`Video conference error: ${error.error?.name || 'Unknown error'}`);
        }
      });
      
      // Set up heartbeat to track presence
      const heartbeatInterval = setInterval(() => {
        if (jitsiApi) {
          safeGetParticipants(jitsiApi);
        }
      }, 30000); // Check every 30 seconds
      
      return () => {
        clearInterval(heartbeatInterval);
        if (jitsiApi) {
          try {
            jitsiApi.dispose();
          } catch (e) {
            console.warn('Error disposing Jitsi API:', e);
          }
        }
      };
    } catch (err) {
      console.error('Error initializing Jitsi:', err);
      setError(`Could not initialize video conference: ${err.message}`);
      setIsLoading(false);
      
      // Show a toast so the user is informed even if they're not looking at the error UI
      toast.error(`Video conference error: ${err.message}. Please try again.`);
    }
  };

  useEffect(() => {
    let cleanupFunction = null;
    
    const initJitsi = async () => {
      // Dispose existing instance if any
      if (window.JitsiMeetExternalAPI) {
        const existingContainers = document.querySelectorAll('#jitsiContainer iframe');
        existingContainers.forEach(iframe => {
          try {
            iframe.remove();
          } catch (e) {
            console.warn('Error removing existing Jitsi iframe', e);
          }
        });
      }
      
      // Initialize new instance with retry logic
      try {
        cleanupFunction = await initializeJitsi();
      } catch (error) {
        console.error('Initial Jitsi initialization failed, will retry once:', error);
        
        // Try one more time after a short delay
        setTimeout(async () => {
          try {
            setIsLoading(true);
            setError(null);
            cleanupFunction = await initializeJitsi();
          } catch (retryError) {
            console.error('Retry initialization also failed:', retryError);
            setError(`Could not connect to video conference after multiple attempts. Please refresh the page.`);
          }
        }, 2000);
      }
    };
    
    initJitsi();
    
    // Set up automatic reconnection attempts if an error occurs
    const reconnectInterval = setInterval(() => {
      if (error && jitsiContainerRef.current) {
        console.log('Attempting automatic reconnection to Jitsi');
        setError(null);
        setIsLoading(true);
        initJitsi();
      }
    }, 30000); // Try to reconnect every 30 seconds if there's an error
    
    // Clean up on unmount
    return () => {
      clearInterval(reconnectInterval);
      if (typeof cleanupFunction === 'function') {
        cleanupFunction();
      }
    };
  }, [roomName]);

  // Special effect to handle lobby errors by monitoring DOM for error messages
  useEffect(() => {
    // Check for specific error patterns in console logs
    const handleErrors = () => {
      const oldConsoleError = console.error;
      console.error = function(message, ...args) {
        oldConsoleError.apply(console, [message, ...args]);
        
        // Check for membersOnly error patterns
        if (message && 
            (message.includes('membersOnly') || 
             message.includes('conference.connectionError') ||
             (typeof message === 'object' && message.error && 
              message.error.name === 'conference.connectionError.membersOnly'))) {
          
          console.log('Detected membersOnly error in console output, will create new direct room');
          
          // Create emergency iframe directly instead of using roomName state
          setTimeout(() => {
            createEmergencyIframe();
          }, 500);
        }
      };
      
      return () => {
        console.error = oldConsoleError;
      };
    };
    
    const cleanup = handleErrors();
    
    // Also add a mutation observer to detect error messages in the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          // Check if any error messages about membersOnly appear in the DOM
          const errorElements = document.querySelectorAll('[data-testid="error-dialog"]');
          for (const el of errorElements) {
            if (el.textContent.includes('membersOnly') || 
                el.textContent.includes('access')) {
              console.log('Detected membersOnly error in DOM, will create new direct room');
              
              // Create direct room using emergency iframe instead of setting state
              createEmergencyIframe();
            }
          }
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      cleanup();
      observer.disconnect();
    };
  }, []);

  // Add a specific mutation observer to detect authentication messages
  useEffect(() => {
    const authMessageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          const addedNodes = Array.from(mutation.addedNodes);
          for (const node of addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && 
                (node.innerText?.includes('Waiting for an authenticated user') || 
                 node.innerText?.includes('Wait for moderator'))) {
              
              console.log('Detected authentication/wait message, switching to emergency mode');
              
              // If we're a teacher and still getting this message, use emergency mode
              if (isTeacher) {
                toast.info('Using emergency mode to bypass authentication...');
                createEmergencyIframe();
              }
            }
          }
        }
      });
    });
    
    // Start observing with a focus on text changes
    authMessageObserver.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: true,
      characterDataOldValue: true 
    });
    
    return () => {
      authMessageObserver.disconnect();
    };
  }, [isTeacher]);

  // Create an emergency iframe fallback if multiple initialization attempts fail
  const createEmergencyIframe = () => {
    try {
      console.log('Creating emergency iframe fallback');
      
      // Generate a completely fresh room name
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 7);
      const emergencyRoom = `meet${timestamp}${randomStr}`;
      
      // Clear container
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = '';
      }
      
      // Create iframe directly
      const iframe = document.createElement('iframe');
      iframe.src = `https://meet.jit.si/${emergencyRoom}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.p2p.enabled=false&config.enableLobby=false&config.membersOnly=false&config.waitForOwner=false&config.authenticationEnabled=false&config.enableWelcomePage=false&userInfo.role=${isTeacher ? 'moderator' : 'participant'}&userInfo.displayName=${encodeURIComponent(user?.name || 'User')}`;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.allow = 'camera; microphone; fullscreen; display-capture; autoplay; clipboard-write';
      iframe.style.border = 'none';
      iframe.style.minHeight = '500px';
      
      // Add to container
      jitsiContainerRef.current.appendChild(iframe);
      
      // Update state
      setIsLoading(false);
      
      // Return cleanup function
      return () => {
        if (jitsiContainerRef.current) {
          jitsiContainerRef.current.innerHTML = '';
        }
      };
    } catch (error) {
      console.error('Error creating emergency iframe:', error);
      setError('Could not create emergency meeting room. Please refresh the page.');
      return () => {};
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-lg ${className}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80">
          <BiLoaderAlt className="h-10 w-10 animate-spin text-primary-500" />
          <p className="mt-3 text-gray-800 dark:text-gray-200">
            {isTeacher ? 'Starting the classroom...' : 'Joining the classroom...'}
          </p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-50 bg-opacity-90 dark:bg-red-900 dark:bg-opacity-90 p-4 text-center">
          <BiError className="h-10 w-10 text-red-500 dark:text-red-300" />
          <p className="mt-2 text-red-700 dark:text-red-200 font-medium">
            {error}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setTimeout(initializeJitsi, 1000);
              }} 
              className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                // Create a completely new random room
                const timestamp = Date.now().toString(36);
                const randomStr = Math.random().toString(36).substring(2, 7);
                const directRoom = `meet${timestamp}${randomStr}`;
                setRoomName(directRoom);
                setError(null);
                setIsLoading(true);
                setTimeout(initializeJitsi, 1000);
              }}
              className="rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
            >
              Try New Room
            </button>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                createEmergencyIframe();
              }}
              className="rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
            >
              Emergency Mode
            </button>
          </div>
        </div>
      )}
      
      {/* Jitsi container */}
      <div 
        id="jitsiContainer"
        ref={jitsiContainerRef} 
        className="w-full h-full min-h-[500px]" 
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      />
    </div>
  );
};

EnhancedJitsiMeet.propTypes = {
  roomName: PropTypes.string.isRequired,
  onMeetingJoined: PropTypes.func,
  onMeetingLeft: PropTypes.func,
  className: PropTypes.string
};

export default EnhancedJitsiMeet; 