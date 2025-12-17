import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import useAuthStore from '@/store/authStore';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import MainLayout from '@/components/layout/MainLayout';
import { Loader } from '@/components/ui/loader';

// Admin Pages
import Programs from '@/pages/admin/Programs';
import Courses from '@/pages/admin/Courses';
import Classes from '@/pages/admin/Classes';
import Assignments from '@/pages/admin/Assignments';
import Teachers from '@/pages/admin/Teachers';
// Placeholders
import { ReportsCenter, AdminSettings } from '@/pages/admin/AdminPages';

// Teacher Pages
import {
  MyCourses,
  OBEMapping,
  Assessments,
  Gradebook,
  Analytics,
  Gamification,
  Feedback
} from '@/pages/teacher/TeacherPages';
import ErrorBoundary from './components/ErrorBoundary';

import ChangePassword from '@/pages/auth/ChangePassword';

function App() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const { user, loading, isFirstLogin } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return <Loader fullScreen text="Initializing OBE360..." />;
  }

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    if (isFirstLogin && window.location.pathname !== '/change-password') {
      return <Navigate to="/change-password" />;
    }
    if (!isFirstLogin && window.location.pathname === '/change-password') {
      return <Navigate to="/dashboard" />;
    }
    return children;
  };

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" richColors closeButton duration={5000} />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

          <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" />} />

          {/* Protected Routes with MainLayout */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Routes */}
            <Route path="/admin/programs" element={<Programs />} />
            <Route path="/admin/courses" element={<Courses />} />
            <Route path="/admin/classes" element={<Classes />} />
            <Route path="/admin/assignments" element={<Assignments />} />
            <Route path="/admin/teachers" element={<Teachers />} />
            <Route path="/admin/reports" element={<ReportsCenter />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Teacher Routes */}
            <Route path="/teacher/courses" element={<MyCourses />} />
            <Route path="/teacher/obe-mapping" element={<OBEMapping />} />
            <Route path="/teacher/assessments" element={<Assessments />} />
            <Route path="/teacher/gradebook" element={<Gradebook />} />
            <Route path="/teacher/analytics" element={<Analytics />} />
            <Route path="/teacher/gamification" element={<Gamification />} />
            <Route path="/teacher/feedback" element={<Feedback />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
