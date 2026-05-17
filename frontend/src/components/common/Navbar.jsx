import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo">Quiz Game</Link>
        </div>

        <div className="nav-links">
          {isAuthenticated && (
            <>
              {!isAdmin && <Link to="/quiz" className="nav-link">Take Quiz</Link>}
              {!isAdmin && <Link to="/attempts" className="nav-link">My Attempts</Link>}
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" className="nav-link admin-link">Dashboard</Link>
                  <Link to="/admin/quizzes" className="nav-link admin-link">Quizzes</Link>
                </>
              )}
            </>
          )}
        </div>

        <div className="nav-actions">
          <DarkModeToggle />
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user?.username}</span>
              <button onClick={handleLogout} className="nav-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link nav-btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
