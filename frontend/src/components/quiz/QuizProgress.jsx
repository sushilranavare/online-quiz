export default function QuizProgress({ current, total, category }) {
    const percentage = Math.round((current / total) * 100);

    return (
        <div className="quiz-progress">
            <div className="progress-info">
                <span className="category-badge">{category}</span>
                <span className="question-count">Question {current} of {total}</span>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}