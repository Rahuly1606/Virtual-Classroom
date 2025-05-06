import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Layout Components
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';

// Course Pages
import CourseList from '../pages/courses/CourseList';
import CourseDetail from '../pages/courses/CourseDetail';
import CreateCourse from '../pages/courses/CreateCourse';
import EditCourse from '../pages/courses/EditCourse';

// Session Pages
import SessionList from '../pages/sessions/SessionList';
import SessionDetail from '../pages/sessions/SessionDetail';
import CreateSession from '../pages/sessions/CreateSession';

// Assignment Pages
import AssignmentList from '../pages/assignments/AssignmentList';
import AssignmentDetail from '../pages/assignments/AssignmentDetail';
import CreateAssignment from '../pages/assignments/CreateAssignment';
import EditAssignment from '../pages/assignments/EditAssignment';
import SubmissionList from '../pages/assignments/SubmissionList';

// Error Pages
import NotFound from '../pages/errors/NotFound';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route index element={<Navigate to="/login" />} />
      </Route>

      {/* Main App Routes */}
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Course Routes */}
        <Route path="courses">
          <Route index element={<CourseList />} />
          <Route path="new" element={<CreateCourse />} />
          <Route path=":courseId" element={<CourseDetail />} />
          <Route path=":courseId/edit" element={<EditCourse />} />
          <Route path=":courseId/sessions/new" element={<CreateSession />} />
          <Route path=":courseId/assignments/new" element={<CreateAssignment />} />
        </Route>
        
        {/* Session Routes */}
        <Route path="sessions">
          <Route index element={<SessionList />} />
          <Route path="new" element={<CreateSession />} />
          <Route path=":sessionId" element={<SessionDetail />} />
        </Route>

        {/* Assignment Routes */}
        <Route path="assignments">
          <Route index element={<AssignmentList />} />
          <Route path="new" element={<CreateAssignment />} />
          <Route path=":assignmentId" element={<AssignmentDetail />} />
          <Route path=":assignmentId/edit" element={<EditAssignment />} />
          <Route path=":assignmentId/submissions" element={<SubmissionList />} />
        </Route>
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 