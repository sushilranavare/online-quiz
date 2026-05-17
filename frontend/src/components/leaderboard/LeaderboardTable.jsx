export default function LeaderboardTable({ leaderboard, selectedCategory, pagination, onPageChange }) {
    if (!leaderboard || leaderboard.length === 0) {
        return (
            <div className="empty-state">
                <p>No scores yet. Be the first to play!</p>
            </div>
        );
    }

    function getRankBadge(rank) {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return null;
    }

    return (
        <div className="leaderboard-table-container">
            {selectedCategory && (
                <div className="filter-info">
                    Showing scores for <strong>{selectedCategory}</strong>
                </div>
            )}

            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th className="rank-col">Rank</th>
                        <th className="user-col">Player</th>
                        <th className="score-col">Total Score</th>
                        <th className="attempts-col">Attempts</th>
                        <th className="best-col">Best Score</th>
                        <th className="avg-col">Average</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, index) => {
                        const badge = getRankBadge(entry.rank);
                        return (
                            <tr key={entry.userId || index} className={badge ? `top-${badge}` : ''}>
                                <td className="rank-col">
                                    {badge ? (
                                        <span className={`rank-badge ${badge}`}>
                                            {entry.rank <= 3 ? getMedal(entry.rank) : entry.rank}
                                        </span>
                                    ) : (
                                        <span className="rank-number">{entry.rank}</span>
                                    )}
                                </td>
                                <td className="user-col">
                                    <span className="username">{entry.username}</span>
                                </td>
                                <td className="score-col">
                                    <span className="total-score">{entry.totalScore}</span>
                                </td>
                                <td className="attempts-col">
                                    {entry.attempts}
                                </td>
                                <td className="best-col">
                                    <span className="best-score">{entry.bestScore}</span>
                                </td>
                                <td className="avg-col">
                                    {entry.averageScore?.toFixed(1) || '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => onPageChange(pagination.page - 1)}
                        className="btn btn-sm"
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => onPageChange(pagination.page + 1)}
                        className="btn btn-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

function getMedal(rank) {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return rank;
}