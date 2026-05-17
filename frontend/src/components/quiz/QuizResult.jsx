export default function QuizResult({ score, total, percentage }) {
    function getGrade(percentage) {
        if (percentage >= 90) return { grade: 'A', message: 'Excellent!' };
        if (percentage >= 80) return { grade: 'B', message: 'Great job!' };
        if (percentage >= 70) return { grade: 'C', message: 'Good work!' };
        if (percentage >= 60) return { grade: 'D', message: 'You passed!' };
        return { grade: 'F', message: 'Keep practicing!' };
    }

    const { grade, message } = getGrade(percentage);

    return (
        <div className="quiz-result">
            <div className={`result-grade grade-${grade.toLowerCase()}`}>
                <span className="grade-letter">{grade}</span>
            </div>
            
            <h1>{message}</h1>
            
            <div className="result-score">
                <span className="score-value">{score}</span>
                <span className="score-divider">/</span>
                <span className="score-total">{total}</span>
            </div>
            
            <p className="result-percentage">{percentage}% correct</p>
        </div>
    );
}