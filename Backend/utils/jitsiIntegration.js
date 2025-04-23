import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Jitsi Meet Integration Utility
 * This utility helps to integrate Jitsi Meet video conferencing
 * into the virtual classroom system.
 */

// Configuration for Jitsi Meet
const JITSI_CONFIG = {
  domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
  appId: process.env.JITSI_APP_ID || '',
  apiKey: process.env.JITSI_API_KEY || '',
};

/**
 * Generate a unique Jitsi Meet room name
 * @param {string} prefix - Prefix for the room name (e.g., course code)
 * @return {string} - Unique room name for Jitsi Meet
 */
export const generateRoomName = (prefix = '') => {
  const sanitizedPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const uniqueId = uuidv4().substring(0, 8);
  return `${sanitizedPrefix ? sanitizedPrefix + '_' : ''}classroom_${uniqueId}`;
};

/**
 * Generate a video conference link using Jitsi Meet
 * @param {string} roomName - The name of the conference room
 * @return {string} - Full URL to the Jitsi Meet room
 */
export const generateVideoLink = (roomName) => {
  return `https://${JITSI_CONFIG.domain}/${roomName}`;
};

/**
 * Generate a JWT token for secure Jitsi Meet rooms (when using your own Jitsi server)
 * @param {Object} user - User object with id, name, email
 * @param {string} roomName - The name of the conference room
 * @param {Object} options - Additional options (e.g. role, expiry)
 * @return {string} - JWT token for Jitsi Meet
 */
export const generateJitsiToken = (user, roomName, options = {}) => {
  // Return null if API key or App ID is not set
  if (!JITSI_CONFIG.apiKey || !JITSI_CONFIG.appId) {
    return null;
  }
  
  const now = new Date();
  const expiry = options.expiry || Math.floor(now.setHours(now.getHours() + 24) / 1000);
  
  const payload = {
    context: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.profilePicture,
        moderator: user.role === 'teacher',
      },
    },
    aud: JITSI_CONFIG.appId,
    iss: JITSI_CONFIG.appId,
    sub: JITSI_CONFIG.domain,
    room: roomName,
    exp: expiry,
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const headerStr = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=+$/, '');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=+$/, '');
  
  const signature = crypto
    .createHmac('sha256', JITSI_CONFIG.apiKey)
    .update(`${headerStr}.${payloadStr}`)
    .digest('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${headerStr}.${payloadStr}.${signature}`;
};

/**
 * Generate video conferencing data for a classroom session
 * @param {Object} user - User creating the session
 * @param {Object} course - Course object
 * @param {string} sessionTitle - Title of the session
 * @return {Object} - Contains roomName, videoLink, and jwtToken (if available)
 */
export const createVideoSession = (user, course, sessionTitle) => {
  const prefix = course.title?.substring(0, 10).replace(/\s+/g, '') || 'class';
  const roomName = generateRoomName(prefix);
  const videoLink = generateVideoLink(roomName);
  const jwtToken = JITSI_CONFIG.apiKey ? generateJitsiToken(user, roomName) : null;
  
  return {
    roomName,
    videoLink,
    jwtToken,
    meetingId: roomName,
  };
}; 