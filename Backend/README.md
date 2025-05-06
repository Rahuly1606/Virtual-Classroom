# Virtual Classroom Backend API

This is the backend API for the Virtual Classroom System, built with Node.js, Express, and MongoDB.

## Features

- User Authentication (JWT-based) with role-based access control
- Course Management
- Video Conferencing Integration with Jitsi Meet
- Class Session Management
- Attendance Tracking
- Assignment & Submission Management
- File Uploads

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Copy `.env.example` to `.env` and update the variables:
   ```
   cp .env.example .env
   ```

### Configuration

Update the `.env` file with your specific configurations:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/virtual-classroom
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
JITSI_APP_ID=your_jitsi_app_id
JITSI_API_KEY=your_jitsi_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Virtual Classroom <your-email@gmail.com>
```

For Gmail, you'll need to use an app password. Instructions for creating an app password:
1. Go to your Google Account settings
2. Navigate to Security
3. Set up 2-Step Verification if not already enabled
4. Create an App Password
5. Use this password in your .env file

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Documentation

The API is documented using Swagger. After starting the server, you can access the API documentation at:

```
http://localhost:5000/api-docs
```

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Courses

- `POST /api/courses` - Create a new course
- `GET /api/courses` - Get all courses
- `GET /api/courses/my-courses` - Get courses taught by the logged-in teacher
- `GET /api/courses/enrolled` - Get courses in which the logged-in student is enrolled
- `GET /api/courses/:id` - Get a course by ID
- `PUT /api/courses/:id` - Update a course
- `DELETE /api/courses/:id` - Delete a course
- `POST /api/courses/:id/enroll` - Enroll in a course
- `PUT /api/courses/:id/drop` - Drop a course
- `GET /api/courses/:id/students` - Get all students enrolled in a course

### Sessions

- `POST /api/sessions` - Create a new session
- `GET /api/sessions/upcoming` - Get upcoming sessions
- `GET /api/sessions/course/:courseId` - Get all sessions for a course
- `GET /api/sessions/:id` - Get a session by ID
- `PUT /api/sessions/:id` - Update a session
- `DELETE /api/sessions/:id` - Delete a session
- `PUT /api/sessions/:id/complete` - Mark a session as completed

### Attendance

- `POST /api/attendance` - Mark attendance for a student
- `POST /api/attendance/bulk` - Mark attendance for multiple students
- `GET /api/attendance/session/:sessionId` - Get attendance for a session
- `GET /api/attendance/student/:studentId/course/:courseId` - Get attendance for a student in a course
- `GET /api/attendance/stats/course/:courseId` - Get attendance statistics for a course
- `PUT /api/attendance/:id` - Update an attendance record

### Assignments

- `POST /api/assignments` - Create a new assignment
- `GET /api/assignments/course/:courseId` - Get all assignments for a course
- `GET /api/assignments/:id` - Get an assignment by ID
- `PUT /api/assignments/:id` - Update an assignment
- `DELETE /api/assignments/:id` - Delete an assignment
- `POST /api/assignments/:id/submit` - Submit an assignment
- `GET /api/assignments/:id/submissions` - Get all submissions for an assignment
- `PUT /api/submissions/:id/grade` - Grade a submission

### Email Verification

- `POST /api/users/send-otp` - Send OTP to user's email address
- `POST /api/users/verify-email` - Verify email with OTP

## Postman Collection

A Postman collection is included in the project for testing the API endpoints. Import the file `postman_collection.json` into Postman to get started.

## Directory Structure

```
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middlewares
├── models/             # Database models
├── routes/             # API routes
├── utils/              # Utility functions
├── uploads/            # Uploaded files
├── server.js           # Entry point
├── .env                # Environment variables
└── package.json        # Dependencies
```

## Technology Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM library
- **JWT**: Authentication
- **Bcrypt**: Password hashing
- **Multer**: File upload handling
- **Jitsi Meet**: Video conferencing
- **Swagger**: API documentation

## Assignment and Submission Management

The platform includes a full-featured assignment management system:

### For Teachers:
- Create assignments with detailed descriptions, file attachments, and deadlines
- Assign to specific courses
- View student submissions
- Grade and provide feedback on submissions

### For Students:
- View all assignments for enrolled courses
- Submit responses with file uploads
- Track submission status and grades

### File Upload with Cloudinary

The system uses Cloudinary for file storage:

1. Create a Cloudinary account at https://cloudinary.com/
2. Get your cloud name, API key, and API secret
3. Add these to your `.env` file:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Supported File Types
- Documents: PDF, Word, Excel, PowerPoint, Text
- Images: JPEG, PNG
- Other formats can be added by modifying the `fileFilter` in `utils/fileUpload.js` 