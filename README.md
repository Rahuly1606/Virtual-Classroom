# Virtual Classroom System  

**A comprehensive platform designed to facilitate online learning and classroom management.** This system aims to provide a seamless experience for teachers and students with features ranging from user authentication and class management to live video conferencing and assignment tracking.

<br>

## Table of Contents
- [Modules](#modules)
- [Path Structure of Project](#path-structure-of-project)
- [Technologies to be Used](#technologies-to-be-used)
- [Functional Requirements](#functional-requirements)
  - [User Authentication & Authorization](#1%EF%B8%8F%E2%83%A3-user-authentication--authorization)
  - [Class Management (For Teachers)](#2%EF%B8%8F%E2%83%A3-class-management-for-teachers)
  - [Student Dashboard](#3%EF%B8%8F%E2%83%A3-student-dashboard)
  - [Live Video Conferencing](#4%EF%B8%8F%E2%83%A3-live-video-conferencing)
  - [Assignment Management](#5%EF%B8%8F%E2%83%A3-assignment-management)
  - [Attendance Tracking](#6%EF%B8%8F%E2%83%A3-attendance-tracking)
  - [Notifications & Announcements](#7%EF%B8%8F%E2%83%A3-notifications--announcements)
  - [User Profile Management](#8%EF%B8%8F%E2%83%A3-user-profile-management)
  - [Chat & Discussion Forum](#9%EF%B8%8F%E2%83%A3-chat--discussion-forum)
  - [Reports & Analytics](#%EF%B8%8F-reports--analytics)
- [Non-Functional Requirements](#-non-functional-requirements)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Contributing](#contributing)
- [License](#license)
- [Customer Journey Map](#customer-journey-map)
- [Empathy Map](#empathy-map)

<br>

# Modules  
1. User Module  <br>  
2. Class Module  <br>  
3. Assignment Module  <br>  
4. Attendance Module  <br>
5. Engagement & Interaction Module<br>
6. Gamification & Motivation Module<br>
7. Assessment & Feedback Module<br>
8. Parental & Progress Tracking Module.<br>

<br>  

<h1>Path Structure of Project</h1><br>
     virtual-classroom/<br>
│── public/<br>
│── src/<br>
│   ├── assets/                # Images & icons<br>
│   ├── components/            # Reusable UI components<br>
│   │   ├── Navbar.js<br>
│   │   ├── Footer.js<br>
│   │   ├── Button.js<br>
│   │   ├── Modal.js<br>
│   ├── pages/                 # Pages of the app<br>
│   │   ├── Dashboard.js<br>
│   │   ├── ClassDetails.js<br>
│   │   ├── Assignments.js<br>
│   │   ├── LiveClass.js<br>
│   │   ├── Attendance.js<br>
│   ├── services/              # API services<br>
│   │   ├── authService.js<br>
│   │   ├── classService.js<br>
│   │   ├── assignmentService.js<br>
│   ├── store/                 # Redux store<br>
│   │   ├── slices/<br>
│   │   │   ├── authSlice.js<br>
│   │   │   ├── classSlice.js<br>
│   │   │   ├── assignmentSlice.js<br>
│   ├── store.js<br>
│   ├── App.js<br>
│   ├── index.js<br>
│── package.json<br>
│── tailwind.config.js<br>
│── .env<br>
│── README.md<br>

<br>  

# Technologies to be Used  <br>  
Frontend: React.js, Tailwind CSS, Redux (for state management)  <br>  
Backend: Django (Python) or Node.js (Express.js)  <br>  
Database: PostgreSQL / MySQL / MongoDB  <br>  
Authentication: JWT (JSON Web Token) or Firebase Auth  <br>  
Video Conferencing: Jitsi Meet / WebRTC / Zoom API  <br>  
Storage: AWS S3 / Firebase Storage (for assignments & recordings)  <br>  
Real-time Communication: Socket.io (for chat & notifications)  <br>  

<br>  

# Functional Requirements  <br>  

## 1️⃣ User Authentication & Authorization  <br>  
Users can sign up as a teacher or student.  <br>  
Users can log in and log out securely.  <br>  
Teachers and students should have role-based access to different features.  <br>  
Passwords should be hashed & stored securely.  <br>  
Implement JWT-based authentication for secure API access.  <br>  

<br>  

# 2️⃣ Class Management (For Teachers)  <br>  
Teachers can create, edit, and delete virtual classes.  <br>  
Teachers can assign students to classes.  <br>  
Teachers can set schedules for live sessions.  <br>  
Teachers can upload study materials (PDFs, Videos, etc.).  <br>  
Teachers can send announcements to students.  <br>  

<br>  

# 3️⃣ Student Dashboard  <br>  
Students can view their enrolled classes.  <br>  
Students can join live classes at scheduled times.  <br>  
Students can download class resources & assignments.  <br>  
Students can view their attendance records.  <br>  

<br>  

# 4️⃣ Live Video Conferencing  <br>  
Students and teachers can join live video classes.  <br>  
Teachers can mute/unmute students.  <br>  
Teachers can share screens and present slides.  <br>  
Students can raise hands to ask questions.  <br>  
Chat functionality within the live session.  <br>  

<br>  

# 5️⃣ Assignment Management  <br>  
Teachers can create, edit, and delete assignments.  <br>  
Students can upload and submit assignments.  <br>  
Teachers can grade assignments and leave feedback.  <br>  
Students can view grades after evaluation.  <br>  

<br>  

# 6️⃣ Attendance Tracking  <br>  
Teachers can mark attendance for each class.  <br>  
Students' attendance status (Present/Absent) is stored in the system.  <br>  
Teachers can download attendance reports.  <br>  
Students can view their own attendance history.  <br>  

<br>  

# 7️⃣ Notifications & Announcements  <br>  
Teachers can send real-time announcements to students.  <br>  
Students get notifications for new assignments, grades, and classes.  <br>  
Notifications can be sent via email/SMS (optional).  <br>  

<br>  

# 8️⃣ User Profile Management  <br>  
Users can update profile pictures & personal details.  <br>  
Teachers can view student profiles.  <br>  
Students can view teacher profiles & ratings.  <br>  

<br>  

# 9️⃣ Chat & Discussion Forum  <br>  
Students can chat with teachers during live sessions.  <br>  
A discussion forum where students can ask doubts.  <br>  
Commenting & reply system for discussions.  <br>  

<br>  

# 🔟 Reports & Analytics  <br>  
Teachers can view student performance reports.  <br>  
Attendance & assignment submission statistics.  <br>  
Export reports in CSV/PDF format.  <br>  

<br>  

# 🚀 Non-Functional Requirements  <br>  
✅ Scalability – The system should handle multiple users concurrently.  <br>  
✅ Security – Prevent unauthorized access, SQL injection, and data leaks.  <br>  
✅ Performance – Optimize API calls and caching for fast responses.  <br>  
✅ Responsive Design – Mobile and tablet compatibility.  <br>  
✅ Usability – Intuitive and easy-to-use interface for teachers and students.  <br>  
✅ Integration – Support external APIs like Google Drive (for file storage) & Zoom (for live classes).  <br>  

<br>  

# Getting Started

This section will guide you through setting up and running the Virtual Classroom System locally.

## Prerequisites

Ensure you have the following installed on your system:
*   Node.js (Specify version, e.g., v18.x or later)
*   npm or yarn
*   Python (Specify version, e.g., v3.9.x or later) and pip (if using Django backend)
*   Git

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://your-repository-url.git
    cd virtual-classroom
    ```
2.  **Frontend Setup:**
    ```bash
    cd src # Or your frontend directory
    npm install
    # or
    yarn install
    ```
3.  **Backend Setup (Example for Django):**
    ```bash
    cd ../backend # Or your backend directory
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    # Perform database migrations, etc.
    # python manage.py migrate
    ```
4.  **Environment Variables:**
    Create a `.env` file in the root directory (and/or frontend/backend directories as needed) and populate it with the necessary environment variables. Refer to `.env.example` if available.
    Example:
    ```
    REACT_APP_API_URL=http://localhost:8000/api
    SECRET_KEY=your_django_secret_key
    DATABASE_URL=your_database_connection_string
    ```

## Running the Project

1.  **Start the Backend Server (Example for Django):**
    ```bash
    cd backend # Or your backend directory
    source venv/bin/activate # If not already activated
    python manage.py runserver
    ```
    The backend will typically run on `http://localhost:8000`.

2.  **Start the Frontend Development Server:**
    ```bash
    cd src # Or your frontend directory
    npm start
    # or
    yarn start
    ```
    The frontend will typically run on `http://localhost:3000`.

Open your browser and navigate to `http://localhost:3000`.

<br>

# Contributing

We welcome contributions to the Virtual Classroom System! Please follow these general guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix: `git checkout -b feature-name` or `bugfix-name`.
3.  Make your changes and commit them with clear, descriptive messages.
4.  Push your changes to your fork: `git push origin feature-name`.
5.  Create a pull request to the `main` (or `develop`) branch of the original repository.
6.  Ensure your code follows the project's coding standards and includes tests where applicable.

<br>

# License

This project is licensed under the [NAME OF LICENSE] - see the `LICENSE.md` file for details (if you create one).

*You should replace `[NAME OF LICENSE]` with the actual license you choose (e.g., MIT, Apache 2.0) and optionally create a `LICENSE.md` file.*

<br>
# Customer Journey Map
<br>
![Customer Journey Map for Virtual Classroom](https://github.com/user-attachments/assets/4356a98e-37de-42a3-878a-20a11e97998d)
<br>
<br>
# Empathy Map
<br>
![Empathy Map for Virtual Classroom Users](https://github.com/user-attachments/assets/7ce4597f-5273-43c5-b887-a3fe67d58481)
<br>

