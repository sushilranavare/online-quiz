import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get('/admin/quizzes/dashboard');
        setStats(response.data.data.stats);
        setQuizzes(response.data.data.quizzes || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load admin dashboard');
      }
    }
    loadDashboard();
  }, []);

  return (
    <section className="card admin-page">
      <div className="admin-header">
        <div><h2>Admin Dashboard</h2><p>Manage quizzes, questions, and users.</p></div>
        <Link className="button-link" to="/admin/quizzes">Manage Quizzes</Link>
      </div>

      {error && <p className="error-message">{error}</p>}
      {stats && (
        <div className="dashboard-grid">
          <div className="stat-card"><strong>Total Quizzes</strong><p>{stats.totalQuizzes}</p></div>
          <div className="stat-card"><strong>Active Quizzes</strong><p>{stats.activeQuizzes}</p></div>
          <div className="stat-card"><strong>Inactive Quizzes</strong><p>{stats.inactiveQuizzes}</p></div>
          <div className="stat-card"><strong>Total Users</strong><p>{stats.totalUsers}</p></div>
        </div>
      )}

      <h3>Quiz Overview</h3>
      <div className="quiz-card-grid">
        {quizzes.map((quiz) => (
          <article key={quiz._id} className="quiz-admin-card">
            <div className="quiz-card-title-row"><h4>{quiz.name}</h4><span className={quiz.isActive ? 'badge active' : 'badge inactive'}>{quiz.isActive ? 'Active' : 'Inactive'}</span></div>
            <p>{quiz.description || 'No description added.'}</p>
            <div className="quiz-card-stats"><span>Total questions: {quiz.totalQuestions}</span><span>Active questions: {quiz.activeQuestions}</span><span>Inactive questions: {quiz.inactiveQuestions}</span></div>
            <Link className="button-link" to="/admin/quizzes">Modify Quiz</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
