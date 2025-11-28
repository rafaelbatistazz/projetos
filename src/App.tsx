import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import PrivateRoute from './components/PrivateRoute';
import { Toaster } from 'sonner';

import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Courses from './pages/admin/Courses';
import Modules from './pages/admin/Modules';
import Lessons from './pages/admin/Lessons';

import Clients from './pages/admin/Clients';
import Settings from './pages/admin/Settings';
import MemberLayout from './layouts/MemberLayout';
import LessonView from './pages/member/LessonView';
import MemberHome from './pages/member/Home';
import CourseModules from './pages/member/CourseModules';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Member Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MemberLayout />}>
              <Route path="/" element={<MemberHome />} />
              <Route path="/course/:courseId" element={<CourseModules />} />
              <Route path="/lesson/:lessonId" element={<LessonView />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<PrivateRoute adminOnly />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="modules" element={<Modules />} />
              <Route path="lessons" element={<Lessons />} />

              <Route path="clients" element={<Clients />} />
              <Route path="settings" element={<Settings />} />
              {/* Add more admin routes here */}
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
