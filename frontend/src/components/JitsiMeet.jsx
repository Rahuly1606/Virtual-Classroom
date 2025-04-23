import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { BiLoaderAlt } from 'react-icons/bi';

const JitsiMeet = ({ 
  roomName, 
  displayName, 
  email,
  onMeetingJoined,
  onMeetingLeft,
  onApiReady,
  isTeacher = false 
}) => {
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load the Jitsi script explicitly if needed
  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        console.log('Jitsi script already loaded');
        resolve();
        return;
      }
      
      // Remove any existing script to avoid duplicates
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

  // Initialize the Jitsi meeting
  const initializeJitsi = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if container ref is ready
      if (!jitsiContainerRef.current) {
        throw new Error('Container not ready');
      }
      
      // Make sure the Jitsi script is loaded
      if (!window.JitsiMeetExternalAPI) {
        await loadJitsiScript();
      }
      
      // Double check if the API is available
      if (!window.JitsiMeetExternalAPI) {
        throw new Error('Jitsi Meet API not available');
      }
      
      // Configure Jitsi options
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: displayName,
          email: email
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: !isTeacher,
          startWithVideoMuted: !isTeacher,
          startAudioOnly: false,
          enableClosePage: true,
          disableInviteFunctions: !isTeacher,
          hideLobbyButton: !isTeacher
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 
            ...(isTeacher ? ['recording', 'livestreaming', 'sharedvideo'] : []),
            'settings', 'raisehand', 'videoquality', 'filmstrip', 'feedback', 
            'stats', 'shortcuts', 'tileview', 'select-background', 'download', 
            'help', ...(isTeacher ? ['mute-everyone', 'security'] : [])
          ],
          SHOW_JITSI_WATERMARK: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          TOOLBAR_ALWAYS_VISIBLE: isTeacher,
          INITIAL_TOOLBAR_TIMEOUT: isTeacher ? 20000 : 5000,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          DEFAULT_LOCAL_DISPLAY_NAME: isTeacher ? 'Instructor' : 'You'
        }
      };

      // Create Jitsi Meet API instance
      console.log('Initializing Jitsi with room:', roomName);
      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = jitsiApi;
      
      // Pass the API reference to parent component if needed
      if (onApiReady) {
        onApiReady(jitsiApi);
      }

      // Add event listeners
      jitsiApi.addEventListeners({
        videoConferenceJoined: () => {
          console.log(`User ${displayName} joined the conference`);
          setIsLoading(false);
          if (onMeetingJoined) onMeetingJoined();
          
          // If teacher, set moderator role
          if (isTeacher) {
            jitsiApi.executeCommand('toggleLobby', true);
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
        videoConferenceLeft: () => {
          console.log(`User ${displayName} left the conference`);
          if (onMeetingLeft) onMeetingLeft();
        },
        participantJoined: (participant) => {
          console.log('Participant joined:', participant);
        },
        participantLeft: (participant) => {
          console.log('Participant left:', participant);
        },
        audioMuteStatusChanged: (muted) => {
          console.log('Audio mute status changed:', muted);
        },
        videoMuteStatusChanged: (muted) => {
          console.log('Video mute status changed:', muted);
        },
        readyToClose: () => {
          console.log('Jitsi is ready to close');
          if (onMeetingLeft) onMeetingLeft();
        },
        errorOccurred: (error) => {
          console.error('Jitsi error:', error);
          setError(`Error in video conference: ${error.error}`);
        }
      });
    } catch (err) {
      console.error('Error initializing Jitsi:', err);
      setError(`Could not initialize video conference: ${err.message}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize the Jitsi API
    initializeJitsi();
    
    // Clean up on unmount
    return () => {
      if (apiRef.current) {
        console.log('Disposing Jitsi API');
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, email]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80">
          <BiLoaderAlt className="h-10 w-10 animate-spin text-primary-500" />
          <p className="mt-3 text-gray-800 dark:text-gray-200">
            {isTeacher ? 'Starting the meeting...' : 'Joining the meeting...'}
          </p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-50 bg-opacity-90 dark:bg-red-900 dark:bg-opacity-90 p-4 text-center">
          <p className="text-red-700 dark:text-red-200 font-medium">
            {error}
          </p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300 max-w-md">
            This may be due to a network issue, browser permissions, or script loading failure. 
            Make sure you have a stable internet connection and that your browser allows Jitsi Meet.
          </p>
          <div className="mt-4 flex space-x-3">
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
              onClick={() => window.location.reload()}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      
      {/* Jitsi container */}
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-full min-h-[500px] rounded-lg overflow-hidden" 
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      />
    </div>
  );
};

JitsiMeet.propTypes = {
  roomName: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  email: PropTypes.string,
  onMeetingJoined: PropTypes.func,
  onMeetingLeft: PropTypes.func,
  onApiReady: PropTypes.func,
  isTeacher: PropTypes.bool
};

export default JitsiMeet; 