# Whereby Integration for Virtual Classroom

This integration allows teachers to create video conferencing sessions using Whereby's API, and students to join these sessions.

## Setup

1. Sign up for a Whereby account at [whereby.com](https://whereby.com/)
2. Get your API key from the Whereby Developer Dashboard
3. Add your API key to the `.env` file:
   ```
   WHEREBY_API_KEY=your_whereby_api_key
   ```
4. Install the required dependencies:
   ```
   npm install
   ```

## Features

- **Teacher-Created Sessions**: Teachers can create video sessions for specific courses
- **Host Controls**: Teachers get a special host link with additional meeting controls
- **Student Access**: Students enrolled in a course can access video sessions
- **Automatic Room Creation**: Video rooms are created via the Whereby API
- **Session Scheduling**: Sessions can be scheduled for specific time slots
- **Room Cleanup**: Rooms are automatically deleted when a session is deleted

## Usage

### Creating a Session (Teachers)

1. Create a new session for a course by providing:
   - Title
   - Course ID
   - Description (optional)
   - Start time
   - End time

2. The system will automatically:
   - Create a Whereby meeting room
   - Generate a regular participant link
   - Generate a host link (for teachers)
   - Store the meeting details

3. When accessing the session, teachers will automatically get the host link with additional controls.

### Joining a Session (Students)

1. Students enrolled in the course can view upcoming sessions
2. They can join a session by clicking on the video link
3. The teacher will need to approve their entry if the room is locked

## API Endpoints

The existing session endpoints remain unchanged, but now support Whereby:

- `POST /api/sessions` - Create a new session
- `GET /api/sessions/course/:courseId` - Get all sessions for a course
- `GET /api/sessions/upcoming` - Get upcoming sessions for the user
- `GET /api/sessions/:id` - Get a specific session
- `PUT /api/sessions/:id` - Update a session
- `DELETE /api/sessions/:id` - Delete a session (also deletes the Whereby room)

## Technical Implementation

The integration uses:
- `wherebyIntegration.js` utility for API calls to Whereby
- Updated Session model with Whereby-specific fields
- Updated controller logic to handle both Whereby and legacy Jitsi integration
- Node-fetch for API requests to Whereby's REST API

## Troubleshooting

- If you encounter API errors, check that your WHEREBY_API_KEY is correct
- Ensure that start and end times are valid (end time must be after start time)
- For rooms that don't get created, check server logs for detailed error messages 