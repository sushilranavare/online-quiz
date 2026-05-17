import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
    const { isAuthenticated } = useAuth();

    const categories = [
        { name: 'Geography', icon: '🌍', description: 'Explore countries, capitals, and landscapes' },
        { name: 'Science', icon: '🔬', description: 'Test your knowledge of physics, chemistry, and biology' },
        { name: 'History', icon: '📜', description: 'Journey through historical events and figures' },
        { name: 'Sports', icon: '⚽', description: 'Challenge your sports trivia knowledge' },
        { name: 'Entertainment', icon: '🎬', description: 'Movies, music, and pop culture' },
        { name: 'Technology', icon: '💻', description: 'Computing, internet, and tech innovations' }
    ];

    return (
        <div className="home-page">
            <header className="hero">
                <h1>Welcome to Quiz Game</h1>
                <p>Challenge yourself with trivia questions across multiple categories</p>
                {isAuthenticated ? (
                    <Link to="/quiz" className="btn btn-primary btn-lg">Start Quiz</Link>
                ) : (
                    <div className="auth-buttons">
                        <Link to="/login" className="btn btn-primary btn-lg">Login</Link>
                        <Link to="/register" className="btn btn-secondary btn-lg">Register</Link>
                    </div>
                )}
            </header>

            <section className="categories-section">
                <h2>Choose a Category</h2>
                <div className="categories-grid">
                    {categories.map(cat => (
                        <div key={cat.name} className="category-card">
                            <span className="category-icon">{cat.icon}</span>
                            <h3>{cat.name}</h3>
                            <p>{cat.description}</p>
                            {isAuthenticated && (
                                <Link to={`/quiz?category=${cat.name}`} className="btn btn-sm">Play</Link>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="features-section">
                <h2>Features</h2>
                <div className="features-grid">
                    <div className="feature-item">
                        <h3>Track Progress</h3>
                        <p>View your quiz history and improvement over time</p>
                    </div>
                    <div className="feature-item">
                        <h3>Leaderboards</h3>
                        <p>Compete with other players globally</p>
                    </div>
                    <div className="feature-item">
                        <h3>Multiple Categories</h3>
                        <p>Six exciting categories to explore</p>
                    </div>
                </div>
            </section>
        </div>
    );
}