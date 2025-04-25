import React, { useState, useEffect } from 'react';
import { BiRefresh, BiVideo, BiCheck, BiError } from 'react-icons/bi';
import Button from './ui/Button';

const TestJitsiConnection = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load the Jitsi script
  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        console.log('Jitsi script already loaded');
        setScriptLoaded(true);
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
        setScriptLoaded(true);
        resolve();
      };
      script.onerror = (e) => {
        console.error('Error loading Jitsi script:', e);
        setError('Failed to load Jitsi API');
        reject(new Error('Failed to load Jitsi API'));
      };
      document.body.appendChild(script);
    });
  };

  // Test connection by briefly creating a Jitsi Meet instance
  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Make sure script is loaded
      if (!window.JitsiMeetExternalAPI) {
        await loadJitsiScript();
      }
      
      // Create test container
      const container = document.createElement('div');
      container.id = 'test-jitsi-container';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);
      
      // Generate a unique room name
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 7);
      const testRoom = `test_${timestamp}_${randomStr}`;
      
      // Configure options
      const options = {
        roomName: testRoom,
        width: '100%',
        height: '100%',
        parentNode: container,
        configOverwrite: {
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          startWithAudioMuted: true,
          startWithVideoMuted: true
        }
      };
      
      // Create Jitsi instance
      console.log('Creating test Jitsi instance');
      const jitsiApi = new window.JitsiMeetExternalAPI('meet.jit.si', options);
      
      // Set up success listener
      jitsiApi.addListener('videoConferenceJoined', () => {
        console.log('Test connection successful');
        setConnectionSuccess(true);
        setConnectionTested(true);
        
        // Clean up
        setTimeout(() => {
          jitsiApi.dispose();
          document.body.removeChild(container);
        }, 500);
      });
      
      // Set up error listener
      jitsiApi.addListener('errorOccurred', (error) => {
        console.error('Jitsi test error:', error);
        setError(`Connection error: ${error.error?.name || 'Unknown error'}`);
        setConnectionSuccess(false);
        setConnectionTested(true);
        
        // Clean up
        setTimeout(() => {
          jitsiApi.dispose();
          document.body.removeChild(container);
        }, 500);
      });
      
      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (!connectionTested) {
          console.log('Test connection timed out');
          setError('Connection test timed out after 10 seconds');
          setConnectionSuccess(false);
          setConnectionTested(true);
          
          // Clean up
          try {
            jitsiApi.dispose();
            document.body.removeChild(container);
          } catch (e) {
            console.warn('Error cleaning up timed out test:', e);
          }
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error in connection test:', error);
      setError(`Connection test failed: ${error.message}`);
      setConnectionSuccess(false);
      setConnectionTested(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Try to load script on mount
  useEffect(() => {
    loadJitsiScript().catch(err => {
      console.error('Error loading Jitsi script on mount:', err);
    });
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <h2 className="text-lg font-medium mb-4">Jitsi Connection Test</h2>
      
      <div className="space-y-4">
        {/* Script Load Status */}
        <div className="flex items-center">
          <div className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center ${
            scriptLoaded ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
          }`}>
            {scriptLoaded ? <BiCheck className="w-4 h-4" /> : '?'}
          </div>
          <span>Jitsi API Script: {scriptLoaded ? 'Loaded' : 'Not Loaded'}</span>
        </div>
        
        {/* Connection Test Status */}
        {connectionTested && (
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center ${
              connectionSuccess 
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
            }`}>
              {connectionSuccess ? <BiCheck className="w-4 h-4" /> : <BiError className="w-4 h-4" />}
            </div>
            <span>Connection Test: {connectionSuccess ? 'Successful' : 'Failed'}</span>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
            {error}
          </div>
        )}
        
        {/* Test Button */}
        <div className="flex justify-center mt-4">
          <Button
            onClick={testConnection}
            disabled={isLoading}
            variant={connectionSuccess ? "success" : "primary"}
            icon={isLoading ? null : (connectionSuccess ? <BiCheck className="w-5 h-5" /> : <BiVideo className="w-5 h-5" />)}
          >
            {isLoading ? 'Testing...' : (
              connectionTested 
                ? (connectionSuccess ? 'Test Again' : 'Retry Test') 
                : 'Test Jitsi Connection'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestJitsiConnection; 