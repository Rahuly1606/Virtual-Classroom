<h1>Modules</h1> 
  1. User Module <br>
  2. Class Module<br>
  3. Assignment Modulel<br>
  4. Attendance Module<br>

     
<h1>Path Structure</h1><br>
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
│   │   ├── store.js<br>
│   ├── App.js<br>
│   ├── index.js<br>
│── package.json<br>
│── tailwind.config.js<br>
│── .env<br>
│── README.md<br>

<h1>Technologies to be Used</h1><br>
Frontend: React.js, Tailwind CSS, Redux (for state management)<br>
Backend: Django (Python) or Node.js (Express.js)<br>
Database: PostgreSQL / MySQL / MongoDB<br>
Authentication: JWT (JSON Web Token) or Firebase Auth<br>
Video Conferencing: Jitsi Meet / WebRTC / Zoom API<br>
Storage: AWS S3 / Firebase Storage (for assignments & recordings)<br>
Real-time Communication: Socket.io (for chat & notifications)<br>

<h1>Functional Requirements</h1>
User Authentication & Authorization<br>
Users can sign up as a teacher or student.<br>
Users can log in and log out securely.<br>
Teachers and students should have role-based access to different features.<br>
Passwords should be hashed & stored securely.<br>
Implement JWT-based authentication for secure API access.<br>

<h1>Class Management (For Teachers)</h1><br>
Teachers can create, edit, and delete virtual classes.<br>
Teachers can assign students to classes.<br>
Teachers can set schedules for live sessions.<br>
Teachers can upload study materials (PDFs, Videos, etc.).<br>
Teachers can send announcements to students.<br>

