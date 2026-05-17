export default function QuizResult({ result }) {
  const timeBonus = result.timeBonus ?? 0;
  const correctAnswers = result.correctAnswers ?? 0;
  const totalQuestions = result.totalQuestions ?? 0;
  const finalScore = result.score ?? correctAnswers;

  return (
    <div className="card quiz-result-card">
      <h2>Quiz Completed</h2>

      <div className="result-summary">
        <div className="result-row"><span>Quiz</span><strong>{result.quizName || 'Timed Quiz'}</strong></div>
        <div className="result-row"><span>Correct answers</span><strong>{correctAnswers} / {totalQuestions}</strong></div>
        <div className="result-row"><span>Time bonus</span><strong>+{timeBonus}</strong></div>
        <div className="result-row result-final-score"><span>Final score</span><strong>{finalScore}</strong></div>
      </div>

      <p className="result-explanation">The final score is correct answers plus a small time bonus capped at +1 point.</p>
      {result.createdAt && <p>Completed at: {new Date(result.createdAt).toLocaleString()}</p>}
    </div>
  );
}
