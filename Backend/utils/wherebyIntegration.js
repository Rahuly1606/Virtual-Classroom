import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

/**
 * Whereby API Integration Utility
 * This utility helps to integrate Whereby video conferencing
 * into the virtual classroom system.
 */

// Configuration for Whereby
const WHEREBY_CONFIG = {
  apiKey: process.env.WHEREBY_API_KEY || '',
  baseUrl: 'https://api.whereby.dev/v1'
};

/**
 * Create a new Whereby meeting room
 * @param {Object} options - Room creation options
 * @param {string} options.roomNamePrefix - Prefix for the room name (e.g., course code)
 * @param {Date} options.startDate - Meeting start date and time
 * @param {Date} options.endDate - Meeting end date and time
 * @param {boolean} options.isLocked - Whether the room should be locked (participants need to knock)
 * @return {Promise<Object>} - Room details including URL, room name, hostRoomUrl
 */
export const createWherebyRoom = async (options = {}) => {
  try {
    const {
      roomNamePrefix = '',
      startDate,
      endDate,
      isLocked = true
    } = options;

    // Validate API key
    if (!WHEREBY_CONFIG.apiKey) {
      throw new Error('Whereby API key is not configured');
    }

    // Whereby requires dates in ISO format and that endDate must be after startDate
    // We need to ensure valid dates are provided
    const meetingStartDate = startDate ? new Date(startDate) : new Date();
    let meetingEndDate;
    
    if (endDate) {
      meetingEndDate = new Date(endDate);
    } else {
      // Default to 1 hour after start time if not specified
      meetingEndDate = new Date(meetingStartDate);
      meetingEndDate.setHours(meetingEndDate.getHours() + 1);
    }

    // Whereby requires at least 10 minutes between start and end
    if ((meetingEndDate - meetingStartDate) < 10 * 60 * 1000) {
      meetingEndDate = new Date(meetingStartDate);
      meetingEndDate.setMinutes(meetingStartDate.getMinutes() + 10);
    }

    // Create a unique room name with prefix
    const sanitizedPrefix = roomNamePrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const uniqueId = uuidv4().substring(0, 8);
    const roomName = `${sanitizedPrefix ? sanitizedPrefix + '-' : ''}classroom-${uniqueId}`;

    // Prepare request to Whereby API
    const response = await fetch(`${WHEREBY_CONFIG.baseUrl}/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHEREBY_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomNamePrefix: roomName,
        startDate: meetingStartDate.toISOString(),
        endDate: meetingEndDate.toISOString(),
        fields: ['hostRoomUrl'],
        isLocked
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Whereby API error: ${errorData.message || response.statusText}`);
    }

    const roomData = await response.json();

    return {
      roomName: roomData.roomName || roomName,
      roomUrl: roomData.roomUrl,
      hostRoomUrl: roomData.hostRoomUrl,
      meetingId: roomData.meetingId || roomData.roomUrl.split('/').pop(),
      startDate: meetingStartDate,
      endDate: meetingEndDate
    };
  } catch (error) {
    console.error('Error creating Whereby room:', error);
    throw error;
  }
};

/**
 * Delete a Whereby meeting room
 * @param {string} meetingId - ID of the meeting to delete
 * @return {Promise<boolean>} - Success status
 */
export const deleteWherebyRoom = async (meetingId) => {
  try {
    if (!WHEREBY_CONFIG.apiKey || !meetingId) {
      return false;
    }

    const response = await fetch(`${WHEREBY_CONFIG.baseUrl}/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${WHEREBY_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting Whereby room:', error);
    return false;
  }
};

/**
 * Generate video conferencing data for a classroom session
 * @param {Object} course - Course object
 * @param {Object} sessionData - Session data including title, startTime, endTime
 * @return {Promise<Object>} - Contains roomUrl, hostRoomUrl, and meetingId
 */
export const createVideoSession = async (course, sessionData) => {
  const { title, startTime, endTime } = sessionData;
  
  // Create a prefix from the course title
  const prefix = course.title.substring(0, 10).replace(/\s+/g, '');
  
  const wherebyRoom = await createWherebyRoom({
    roomNamePrefix: prefix,
    startDate: startTime,
    endDate: endTime,
    isLocked: true // Teachers need to let students in
  });
  
  return {
    roomUrl: wherebyRoom.roomUrl,
    hostRoomUrl: wherebyRoom.hostRoomUrl,
    meetingId: wherebyRoom.meetingId,
    roomName: wherebyRoom.roomName
  };
}; 