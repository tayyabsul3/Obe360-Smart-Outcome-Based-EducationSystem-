import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import useAuthStore from '@/store/authStore';
import useUIStore from '@/store/uiStore';

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
import AdminStudents from '@/pages/admin/Students'; // Renamed to identify as Admin
// Placeholders
import { ReportsCenter, AdminSettings } from '@/pages/admin/AdminPages';

// Teacher Pages
import {
  MyCourses,
  OBEMapping,
  Gradebook,
  Analytics,
  Gamification,
  Feedback,
  CLOManager, // Added
  AssessmentManager,
  Students
} from '@/pages/teacher/TeacherPages';
import TeacherRootLayout from '@/pages/teacher/TeacherRootLayout';
import TeacherCourseLayout from '@/pages/teacher/TeacherCourseLayout';
import ErrorBoundary from './components/ErrorBoundary';

import ChangePassword from '@/pages/auth/ChangePassword';

import GlobalLoader from '@/components/ui/global-loader';

function App() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const { user, loading, isFirstLogin } = useAuthStore();

  const { fontScale } = useUIStore();

  useEffect(() => {
    // Apply font scale to root
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (fontScale === 'small') root.classList.add('text-sm');
    if (fontScale === 'medium') root.classList.add('text-base');
    if (fontScale === 'large') root.classList.add('text-lg');
  }, [fontScale]);

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
        <GlobalLoader />
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
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/reports" element={<ReportsCenter />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Teacher Routes */}
            {/* Teacher Routes - New Layout */}
            {/* Teacher Routes - Restructured */}
          </Route>

          {/* Teacher Routes - Independent Layout */}
          <Route path="/teacher" element={
            <ProtectedRoute>
              <TeacherRootLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="courses" replace />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="analytics" element={<Analytics />} />

            {/* Course Context Routes */}
            <Route path="course/:courseId" element={<TeacherCourseLayout />}>
              <Route index element={<Navigate to="clos" replace />} />
              <Route path="clos" element={<CLOManager />} />
              <Route path="assessments" element={<AssessmentManager />} />
              <Route path="gradebook" element={<Gradebook />} />
              <Route path="students" element={<Students />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            <Route path="gamification" element={<Gamification />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
