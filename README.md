<h1>Models</h1> 
  1. User Model
  2. Class Model
  3. Assignment Model
  4. Attendance Model

     
<h1>Path Structure</h1>
     virtual-classroom/
│── public/
│── src/
│   ├── assets/                # Images & icons
│   ├── components/            # Reusable UI components
│   │   ├── Navbar.js
│   │   ├── Footer.js
│   │   ├── Button.js
│   │   ├── Modal.js
│   ├── pages/                 # Pages of the app
│   │   ├── Dashboard.js
│   │   ├── ClassDetails.js
│   │   ├── Assignments.js
│   │   ├── LiveClass.js
│   │   ├── Attendance.js
│   ├── services/              # API services
│   │   ├── authService.js
│   │   ├── classService.js
│   │   ├── assignmentService.js
│   ├── store/                 # Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── classSlice.js
│   │   │   ├── assignmentSlice.js
│   │   ├── store.js
│   ├── App.js
│   ├── index.js
│── package.json
│── tailwind.config.js
│── .env
│── README.md

