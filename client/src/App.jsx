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
import AdminRootLayout from '@/pages/admin/AdminRootLayout';

// Teacher Pages
import {
  MyCourses,
  OBEMapping,
  Gradebook,
  Gamification,
  Feedback,
  CLOManager,
  AssessmentManager,
  Students,
  PLOMapping
} from '@/pages/teacher/TeacherPages';
import TeacherRootLayout from '@/pages/teacher/TeacherRootLayout';
import TeacherCourseLayout from '@/pages/teacher/TeacherCourseLayout';
import ErrorBoundary from './components/ErrorBoundary';

import ChangePassword from '@/pages/auth/ChangePassword';

import GlobalLoader from '@/components/ui/global-loader';

function App() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const { user, loading, isFirstLogin, role } = useAuthStore();

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

          {/* Dashboard Redirector */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {role === 'admin' ? <Dashboard /> : <Navigate to="/teacher/courses" replace />}
            </ProtectedRoute>
          } />

          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Portal - Independent Layout */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRootLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="programs" replace />} />
            <Route path="programs" element={<Programs />} />
            <Route path="courses" element={<Courses />} />
            <Route path="classes" element={<Classes />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="dashboard" element={<div>Admin Dashboard (Static Stats Coming Soon)</div>} />
          </Route>

          {/* Teacher Routes */}
          {/* Teacher Routes - New Layout */}
          {/* Teacher Routes - Restructured */}

          {/* Teacher Routes - Independent Layout */}
          <Route path="/teacher" element={
            <ProtectedRoute>
              <TeacherRootLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="courses" replace />} />
            <Route path="courses" element={<MyCourses />} />

            {/* Course Context Routes */}
            <Route path="course/:courseId" element={<TeacherCourseLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<MyCourses />} /> {/* This will be revamped to show course details */}

              {/* CLO Module */}
              <Route path="clos" element={<CLOManager />} />
              <Route path="attainment" element={<div className="p-4 bg-white rounded shadow-sm">CLO Attainment coming soon</div>} />
              <Route path="graph" element={<div className="p-4 bg-white rounded shadow-sm">CLO Graph coming soon</div>} />
              <Route path="comments" element={<div className="p-4 bg-white rounded shadow-sm">CLO Comments coming soon</div>} />

              {/* PLO Module */}
              <Route path="plo-mapping" element={<PLOMapping />} />
              <Route path="plo-attainment" element={<div className="p-4 bg-white rounded shadow-sm">PLO Attainment coming soon</div>} />

              {/* View Class Module */}
              <Route path="content" element={<div className="p-4 bg-white rounded shadow-sm">Course Content coming soon</div>} />
              <Route path="plan" element={<div className="p-4 bg-white rounded shadow-sm">Teaching Plan coming soon</div>} />

              {/* Assessments Module */}
              <Route path="assessments" element={<AssessmentManager />} />
              <Route path="gradebook" element={<Gradebook />} />
              <Route path="upload" element={<div className="p-4 bg-white rounded shadow-sm">Excel Upload coming soon</div>} />

              {/* Students Module */}
              <Route path="students" element={<Students />} />
              <Route path="attendance" element={<div className="p-4 bg-white rounded shadow-sm">Student Attendance coming soon</div>} />
              <Route path="assistants" element={<div className="p-4 bg-white rounded shadow-sm">Class Assistants coming soon</div>} />

              {/* Reports Module */}
              <Route path="report" element={<div className="p-4 bg-white rounded shadow-sm">Course Report coming soon</div>} />
              <Route path="summary" element={<div className="p-4 bg-white rounded shadow-sm">OBE Summary coming soon</div>} />

            </Route>

            <Route path="gamification" element={<Gamification />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </ErrorBoundary >
  );
}

export default App;
