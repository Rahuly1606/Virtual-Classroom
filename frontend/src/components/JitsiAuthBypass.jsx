import React, { useState, useEffect } from 'react';
import { BiErrorCircle, BiLock, BiLockOpen } from 'react-icons/bi';
import Button from './ui/Button';
import { toast } from 'react-toastify';

/**
 * JitsiAuthBypass - A component to handle Jitsi authentication issues
 * Specifically targets the "Waiting for an authenticated user" problem
 */
const JitsiAuthBypass = ({ roomName, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bypassAttempted, setBypassAttempted] = useState(false);

  // This function creates a direct, non-authenticated Jitsi room
  const createDirectRoom = () => {
    setIsLoading(true);
    
    try {
      // Create a unique, sanitized room name
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 7);
      const directRoom = roomName 
        ? `${roomName.replace(/[^a-zA-Z0-9]/g, '_')}_direct_${randomStr}`
        : `direct_room_${timestamp}_${randomStr}`;
        
      // Generate a URL with all auth requirements disabled and additional parameters
      const bypassUrl = `https://meet.jit.si/${directRoom}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.enableLobby=false&config.membersOnly=false&config.waitForOwner=false&config.authenticationEnabled=false&config.p2p.enabled=false&interfaceConfig.HIDE_INVITE_MORE_HEADER=true&interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true&config.disableInitialGUM=false&config.disableAudioLevels=true&config.useStunTurn=true&config.enableWelcomePage=false&config.enableClosePage=false&config.hideLobbyButton=true&config.requireDisplayName=false&config.enableLayerSuspension=true&config.channelLastN=4&config.startAudioMuted=0&config.startVideoMuted=0&userInfo.role=moderator`;
      
      // Open in a new tab
      window.open(bypassUrl, '_blank');
      
      toast.success("Opened direct meeting room in new tab");
      setBypassAttempted(true);
      
      if (onSuccess) {
        onSuccess(directRoom);
      }
    } catch (error) {
      console.error("Error creating direct room:", error);
      toast.error("Failed to create direct room");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Creates a bypass directly within the current page
  const createInlineBypass = (containerId) => {
    setIsLoading(true);
    
    try {
      // Find the container
      const container = document.getElementById(containerId);
      if (!container) {
        toast.error("Could not find container to inject bypass");
        return;
      }
      
      // Clear any existing content
      container.innerHTML = '';
      
      // Generate unique room name
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 7);
      const directRoom = roomName 
        ? `${roomName.replace(/[^a-zA-Z0-9]/g, '_')}_inline_${randomStr}`
        : `inline_room_${timestamp}_${randomStr}`;
        
      // Create an iframe with authentication disabled and improved parameters
      const iframe = document.createElement('iframe');
      iframe.src = `https://meet.jit.si/${directRoom}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.enableLobby=false&config.membersOnly=false&config.waitForOwner=false&config.authenticationEnabled=false&userInfo.displayName=Participant&userInfo.role=moderator&config.disableInitialGUM=false&config.useStunTurn=true&config.enableWelcomePage=false&config.enableClosePage=false&config.hideLobbyButton=true&config.requireDisplayName=false&interfaceConfig.HIDE_INVITE_MORE_HEADER=true&interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.minHeight = '600px';
      iframe.style.border = 'none';
      iframe.allow = 'camera; microphone; fullscreen; display-capture; autoplay; clipboard-write';
      iframe.setAttribute('allowfullscreen', 'true');
      
      // Add to container
      container.appendChild(iframe);
      
      toast.success("Created direct meeting room in current page");
      setBypassAttempted(true);
      
      if (onSuccess) {
        onSuccess(directRoom);
      }
    } catch (error) {
      console.error("Error creating inline bypass:", error);
      toast.error("Failed to create inline room");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a third option for extremely problematic cases
  const createEmergencyIframeMode = () => {
    setIsLoading(true);
    
    try {
      // Find or create a container
      let container = document.getElementById('jitsi-wrapper');
      if (!container) {
        container = document.querySelector('.card-body') || document.getElementById('jitsiContainer');
        if (!container) {
          toast.error("Could not find a suitable container");
          return;
        }
      }
      
      // Clear container
      container.innerHTML = '';
      
      // Create an emergency message with iframe
      const wrapper = document.createElement('div');
      wrapper.className = 'p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center';
      wrapper.innerHTML = `
        <h3 class="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3">
          Direct Connection Established
        </h3>
        <p class="text-sm text-blue-700 dark:text-blue-300 mb-4">
          Using direct connection mode to bypass authentication requirements.
        </p>
      `;
      
      // Generate unique room name
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 7);
      const emergencyRoom = `emergency_${timestamp.substr(0,4)}_${randomStr}`;
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = `https://meet.jit.si/${emergencyRoom}?skipPermissionCheck=true#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.enableLobby=false&config.membersOnly=false&config.waitForOwner=false&config.authenticationEnabled=false`;
      iframe.width = '100%'; 
      iframe.height = '500px';
      iframe.style.border = '1px solid #3B82F6';
      iframe.style.borderRadius = '0.375rem';
      iframe.style.marginTop = '1rem';
      iframe.allow = 'camera; microphone; fullscreen; display-capture; autoplay; clipboard-write';
      iframe.setAttribute('allowfullscreen', 'true');
      
      // Add iframe to wrapper
      wrapper.appendChild(iframe);
      
      // Add wrapper to container
      container.appendChild(wrapper);
      
      toast.success("Created emergency connection");
      setBypassAttempted(true);
      
      if (onSuccess) {
        onSuccess(emergencyRoom);
      }
    } catch (error) {
      console.error("Error creating emergency iframe:", error);
      toast.error("Failed to create emergency connection");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-center">
      <div className="flex justify-center mb-3">
        {bypassAttempted ? (
          <BiLockOpen className="h-10 w-10 text-green-500" />
        ) : (
          <BiLock className="h-10 w-10 text-yellow-500" />
        )}
      </div>
      
      <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        Authentication Bypass
      </h3>
      
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
        {bypassAttempted 
          ? "A direct meeting room has been created to bypass authentication."
          : "Seeing 'Waiting for an authenticated user' message? Create a direct room to bypass authentication."}
      </p>
      
      <div className="flex flex-col space-y-2">
        <Button
          variant="warning"
          onClick={createDirectRoom}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Creating..." : "Open in New Tab"}
        </Button>
        
        <Button
          variant="primary"
          onClick={() => createInlineBypass('jitsi-wrapper')}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Creating..." : "Replace Current Room"}
        </Button>
        
        <Button
          variant="danger"
          onClick={createEmergencyIframeMode}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Creating..." : "Emergency Override Mode"}
        </Button>
      </div>
      
      {bypassAttempted && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3">
          Note: You may need to allow popups for this site or check your browser's popup blocker.
        </p>
      )}
    </div>
  );
};

export default JitsiAuthBypass; 