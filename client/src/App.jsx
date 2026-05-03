import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import useAuthStore from '@/store/authStore';
import useUIStore from '@/store/uiStore';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import MainLayout from '@/components/layout/MainLayout';
import { Loader } from '@/components/ui/loader';

// Admin Pages
import Programs from '@/pages/admin/Programs';
import PLOs from '@/pages/admin/PLOs';
import Courses from '@/pages/admin/Courses';
import Classes from '@/pages/admin/Classes';
import Assignments from '@/pages/admin/Assignments';
import Teachers from '@/pages/admin/Teachers';
import AdminStudents from '@/pages/admin/Students'; // Renamed to identify as Admin
import Settings from '@/pages/admin/Settings';
// Placeholders
import { ReportsCenter } from '@/pages/admin/AdminPages';
import AdminRootLayout from '@/pages/admin/AdminRootLayout';

// Teacher Pages
import {
  PLOMapping, Students,
  AwardList, GPAManager, PLOReport,
  ConsolidatedReport, CourseBreadth, GPAAttainmentGraph,
  CLOAttainment, CLOAttainmentGraph, PLOAttainment, PLOAttainmentGraph, MyCourses, CLOManager, OBEMarks, AssessmentManager, Gradebook, Gamification, Feedback
} from './pages/teacher/TeacherPages';
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
    if (!user) return <Navigate to="/" />;
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
          <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

          <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" />} />

          {/* Dashboard Redirector */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/teacher/courses" replace />}
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
              {role === 'admin' ? <AdminRootLayout /> : <Navigate to="/dashboard" />}
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="programs" replace />} />
            <Route path="programs" element={<Programs />} />
            <Route path="plos" element={<PLOs />} />
            <Route path="courses" element={<Courses />} />
            <Route path="classes" element={<Classes />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="settings" element={<Settings />} />
            <Route path="dashboard" element={<Dashboard />} />
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
              <Route path="clos/attainment" element={<CLOAttainment />} />
              <Route path="clos/attainment-graph" element={<CLOAttainmentGraph />} />

              {/* PLO Module */}
              <Route path="plos/attainment" element={<PLOAttainment />} />
              <Route path="plos/attainment-graph" element={<PLOAttainmentGraph />} />

              {/* Report Features */}
              <Route path="reports/plo" element={<PLOReport />} />
              <Route path="reports/consolidated" element={<ConsolidatedReport />} />
              <Route path="reports/breadth" element={<CourseBreadth />} />
              <Route path="reports/gpa-graph" element={<GPAAttainmentGraph />} />

              {/* Assessments Module */}
              <Route path="assessments" element={<AssessmentManager />} />
              <Route path="assessments/gpa" element={<GPAManager />} />
              <Route path="assessments/award-list" element={<AwardList />} />
              <Route path="obe-marks" element={<OBEMarks />} />

              {/* Students Module */}
              <Route path="students" element={<Students />} />

              {/* Other Routes */}
              <Route path="activity-weights" element={<div className="p-4 bg-white rounded shadow-sm">Activity Weights coming soon</div>} />
              <Route path="contents" element={<div className="p-4 bg-white rounded shadow-sm">Course Contents coming soon</div>} />
              <Route path="cqi" element={<div className="p-4 bg-white rounded shadow-sm">CQI Actions coming soon</div>} />
            </Route>

            <Route path="gamification" element={<Gamification />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary >
  );
}

export default App;
