# Virtual Classroom System  

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
