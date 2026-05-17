export default function LeaderboardTable({ leaderboard }) {
  if (!leaderboard.length) return <p>No leaderboard attempts found yet.</p>;

  return (
    <div className="table-wrapper">
      <table className="admin-table">
        <thead><tr><th>Rank</th><th>User</th><th>Quiz</th><th>Score</th><th>Correct</th><th>Time Bonus</th><th>Date</th></tr></thead>
        <tbody>
          {leaderboard.map((attempt, index) => (
            <tr key={attempt._id}>
              <td>{index + 1}</td>
              <td>{attempt.username}</td>
              <td>{attempt.quizName || 'Timed Quiz'}</td>
              <td>{attempt.score}</td>
              <td>{attempt.correctAnswers} / {attempt.totalQuestions}</td>
              <td>+{attempt.timeBonus || 0}</td>
              <td>{new Date(attempt.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
