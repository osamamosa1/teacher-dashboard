import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageTeachers from './pages/ManageTeachers';
import ManageCourses from './pages/ManageCourses';
import CourseCurriculum from './pages/CourseCurriculum';
import LessonForm from './pages/LessonForm';
import ManageStudents from './pages/ManageStudents';
import ManageParents from './pages/ManageParents';
import ManageSubjects from './pages/ManageSubjects';
import Profile from './pages/Profile';
import ManageGrades from './pages/ManageGrades';
import MonthlyRevenue from './pages/MonthlyRevenue';
import MonthTransactions from './pages/MonthTransactions';
import CurrentExams from './pages/CurrentExams';
import AdminSettings from './pages/AdminSettings';
import Layout from './components/Layout';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <Router basename="/dashboard">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminSettings />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/teachers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <ManageTeachers />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/subjects" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <ManageSubjects />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/grades" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <ManageGrades />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/parents" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <ManageParents />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <TeacherDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/courses" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <ManageCourses />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/grades" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <ManageGrades />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/revenue" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <MonthlyRevenue />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/revenue/:month" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <MonthTransactions />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/courses/:courseId" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <CourseCurriculum />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/students" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <ManageStudents />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/courses/:courseId/lessons/new" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <LessonForm />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/courses/:courseId/lessons/:lessonId/edit" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <LessonForm />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/current-exams" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout>
              <CurrentExams />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router >
  );
}

export default App;
