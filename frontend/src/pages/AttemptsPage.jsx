import { useState, useEffect } from 'react';
import { getUserAttempts } from '../api/scoreApi';
import AttemptCard from '../components/attempts/AttemptCard';

export default function AttemptsPage() {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAttempts();
    }, []);

    async function loadAttempts() {
        try {
            setLoading(true);
            const response = await getUserAttempts();
            if (response.success) {
                setAttempts(response.data.attempts);
            }
        } catch (err) {
            setError(err.message || 'Failed to load attempts');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="attempts-page">
            <div className="page-header">
                <h1>My Attempts</h1>
            </div>

            {loading ? (
                <div className="loading">Loading attempts...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : attempts.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't completed any quizzes yet.</p>
                    <a href="/quiz" className="btn btn-primary">Take Your First Quiz</a>
                </div>
            ) : (
                <div className="attempts-grid">
                    {attempts.map(attempt => (
                        <AttemptCard key={attempt._id} attempt={attempt} />
                    ))}
                </div>
            )}
        </div>
    );
}