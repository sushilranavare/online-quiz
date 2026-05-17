import { useEffect, useState } from 'react';
import { leaderboardApi } from '../api/leaderboardApi';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await leaderboardApi.getLeaderboard();
        setLeaderboard(response.data.data.leaderboard || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <section className="card">
      <h2>Leaderboard</h2>

      <p>
        Ranking is based on the final timed quiz score. The score includes
        correct answers plus a small time bonus.
      </p>

      {loading && <p>Loading leaderboard...</p>}
      {error && <p className="error">{error}</p>}

      <LeaderboardTable leaderboard={leaderboard} />
    </section>
  );
}
