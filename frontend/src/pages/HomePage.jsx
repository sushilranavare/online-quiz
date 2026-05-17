import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="home-page">
      <section className="hero-section card">
        <h1>Online Timed Quiz Game</h1>
        <p>
          Attempt active quizzes with a timer for each question, track your
          attempts, and compare scores on the leaderboard.
        </p>

        {isAuthenticated ? (
          isAdmin ? (
            <Link to="/admin/dashboard" className="btn btn-primary">Open Admin Dashboard</Link>
          ) : (
            <Link to="/quiz" className="btn btn-primary">Choose a Quiz</Link>
          )
        ) : (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        )}
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <h3>Timed Questions</h3>
          <p>Each question has its own countdown timer.</p>
        </div>
        <div className="feature-card">
          <h3>Quiz Selection</h3>
          <p>Choose from active quizzes created by admin users.</p>
        </div>
        <div className="feature-card">
          <h3>Leaderboard</h3>
          <p>Scores include correct answers plus a small time bonus.</p>
        </div>
      </section>
    </div>
  );
}
