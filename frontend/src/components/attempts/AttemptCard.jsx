import { Link } from 'react-router-dom';

export default function AttemptCard({ attempt }) {
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getScorePercentage(score, total) {
        return Math.round((score / total) * 100);
    }

    const percentage = getScorePercentage(attempt.score, attempt.totalQuestions);
    
    function getGradeClass(percentage) {
        if (percentage >= 90) return 'grade-a';
        if (percentage >= 80) return 'grade-b';
        if (percentage >= 70) return 'grade-c';
        if (percentage >= 60) return 'grade-d';
        return 'grade-f';
    }

    return (
        <div className="attempt-card">
            <div className="attempt-header">
                <span className={`category-badge ${attempt.category?.toLowerCase()}`}>
                    {attempt.category}
                </span>
                <span className="attempt-date">{formatDate(attempt.completedAt)}</span>
            </div>

            <div className="attempt-score">
                <div className="score-main">
                    <span className="score-value">{attempt.score}</span>
                    <span className="score-divider">/</span>
                    <span className="score-total">{attempt.totalQuestions}</span>
                </div>
                <div className={`score-percentage ${getGradeClass(percentage)}`}>
                    {percentage}%
                </div>
            </div>

            <div className="attempt-details">
                <div className="detail-item">
                    <span className="detail-label">Correct Answers</span>
                    <span className="detail-value">{attempt.score}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Time Spent</span>
                    <span className="detail-value">
                        {attempt.timeSpent ? `${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s` : 'N/A'}
                    </span>
                </div>
            </div>

            {attempt.answers && attempt.answers.length > 0 && (
                <div className="attempt-actions">
                    <Link to={`/attempts/${attempt._id}`} className="btn btn-sm btn-secondary">
                        View Details
                    </Link>
                </div>
            )}
        </div>
    );
}