import { useEffect, useState } from 'react';
import { scoreApi } from '../api/scoreApi';
import AttemptCard from '../components/attempts/AttemptCard';

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAttempts() {
      try {
        setLoading(true);
        setError('');
        const response = await scoreApi.getUserAttempts();
        setAttempts(response.data.data.attempts || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load attempts');
      } finally {
        setLoading(false);
      }
    }
    loadAttempts();
  }, []);

  return (
    <section className="card">
      <h2>My Attempts</h2>
      <p>This page shows previous timed quiz attempts, including score and time bonus.</p>
      {loading && <p>Loading attempts...</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="quiz-card-grid">
        {attempts.map((attempt) => <AttemptCard key={attempt._id} attempt={attempt} />)}
        {!attempts.length && !loading && <div className="empty-state">No attempts found yet.</div>}
      </div>
    </section>
  );
}
