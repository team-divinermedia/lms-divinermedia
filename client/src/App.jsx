import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ThemeToggle from './components/ThemeToggle';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import Dashboard from './pages/learner/Dashboard';
import CourseList from './pages/learner/CourseList';
import CourseDetail from './pages/learner/CourseDetail';
import LessonViewer from './pages/learner/LessonViewer';
import AssessmentPage from './pages/learner/AssessmentPage';
import DoubtList from './pages/learner/DoubtList';
import DoubtForm from './pages/learner/DoubtForm';
import ProofList from './pages/learner/ProofList';
import ProofForm from './pages/learner/ProofForm';

import AdminDashboard from './pages/admin/AdminDashboard';
import CourseManager from './pages/admin/CourseManager';
import CourseForm from './pages/admin/CourseForm';
import AdminCourseDetail from './pages/admin/AdminCourseDetail';
import ModuleForm from './pages/admin/ModuleForm';
import LessonForm from './pages/admin/LessonForm';
import AssessmentForm from './pages/admin/AssessmentForm';
import AssessmentReview from './pages/admin/AssessmentReview';
import DoubtManager from './pages/admin/DoubtManager';
import ProofReview from './pages/admin/ProofReview';
import LearnerManager from './pages/admin/LearnerManager';
import InviteManager from './pages/admin/InviteManager';
import Reports from './pages/admin/Reports';

function AppRoutes() {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register/:token" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={isAdmin ? <AdminDashboard /> : <Dashboard />} />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="lessons/:id" element={<LessonViewer />} />
        <Route path="assessments/:id" element={<AssessmentPage />} />
        <Route path="doubts" element={<DoubtList />} />
        <Route path="doubts/new" element={<DoubtForm />} />
        <Route path="proofs" element={<ProofList />} />
        <Route path="proofs/new" element={<ProofForm />} />

        <Route path="admin/courses" element={<ProtectedRoute adminOnly><CourseManager /></ProtectedRoute>} />
        <Route path="admin/courses/new" element={<ProtectedRoute adminOnly><CourseForm /></ProtectedRoute>} />
        <Route path="admin/courses/:id" element={<ProtectedRoute adminOnly><AdminCourseDetail /></ProtectedRoute>} />
        <Route path="admin/courses/:id/edit" element={<ProtectedRoute adminOnly><CourseForm /></ProtectedRoute>} />
        <Route path="admin/modules/:courseId/new" element={<ProtectedRoute adminOnly><ModuleForm /></ProtectedRoute>} />
        <Route path="admin/lessons/:moduleId/new" element={<ProtectedRoute adminOnly><LessonForm /></ProtectedRoute>} />
        <Route path="admin/lessons/:id/edit" element={<ProtectedRoute adminOnly><LessonForm /></ProtectedRoute>} />
        <Route path="admin/assessments/new" element={<ProtectedRoute adminOnly><AssessmentForm /></ProtectedRoute>} />
        <Route path="admin/assessments/:id/edit" element={<ProtectedRoute adminOnly><AssessmentForm /></ProtectedRoute>} />
        <Route path="admin/doubts" element={<ProtectedRoute adminOnly><DoubtManager /></ProtectedRoute>} />
        <Route path="admin/proofs" element={<ProtectedRoute adminOnly><ProofReview /></ProtectedRoute>} />
        <Route path="admin/learners" element={<ProtectedRoute adminOnly><LearnerManager /></ProtectedRoute>} />
        <Route path="admin/invites" element={<ProtectedRoute adminOnly><InviteManager /></ProtectedRoute>} />
        <Route path="admin/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import { ThemeProvider } from './contexts/ThemeContext';
import ServerWakeup from './components/ServerWakeup';

export default function App() {
  return (
    <ServerWakeup>
      <ThemeProvider defaultTheme="dark">
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ServerWakeup>
  );
}
