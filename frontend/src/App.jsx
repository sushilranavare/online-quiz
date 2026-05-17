import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/common/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import AttemptsPage from './pages/AttemptsPage';
import LeaderboardPage from './pages/LeaderboardPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminQuizzesPage from './pages/admin/AdminQuizzesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/attempts" element={<ProtectedRoute><AttemptsPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />

          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/quizzes" element={<AdminRoute><AdminQuizzesPage /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
