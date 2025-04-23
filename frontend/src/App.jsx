import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'
import useAuth from './hooks/useAuth'

// Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Courses from './pages/courses/Courses'
import CourseDetail from './pages/courses/CourseDetail'
import CourseForm from './pages/courses/CourseForm'
import Sessions from './pages/sessions/Sessions'
import Session from './pages/sessions/Session'
import SessionDetail from './pages/sessions/SessionDetail'
import SessionForm from './pages/sessions/SessionForm'
import Profile from './pages/profile/Profile'
import NotFound from './pages/NotFound'

// Components
import Layout from './components/layout/Layout'
import Spinner from './components/ui/Spinner'

// Routes with auth provider
const AppRoutes = () => {
  // ProtectedRoute component
  const ProtectedRoute = ({ children }) => {
    const auth = useAuth()
    
    if (auth.loading) {
      return <Spinner />
    }
    
    if (!auth.isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    
    return children
  }

  // Public route that redirects authenticated users to the dashboard
  const PublicRoute = ({ children }) => {
    const auth = useAuth()
    
    if (auth.loading) {
      return <Spinner />
    }
    
    if (auth.isAuthenticated) {
      return <Navigate to="/" replace />
    }
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    )
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        {/* Root redirects to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Protected Routes */}
        <Route 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/create" element={<CourseForm />} />
          <Route path="courses/edit/:id" element={<CourseForm />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/create" element={<SessionForm />} />
          <Route path="sessions/edit/:id" element={<SessionForm />} />
          <Route path="sessions/:id" element={<Session />} />
          <Route path="sessions/:id/detail" element={<SessionDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}

// Main App component
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
