export default function QuizProgress({ currentIndex, totalQuestions, timeRemaining, questionTimeSeconds }) {
  const isTimeLow = timeRemaining <= 5;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="quiz-progress-wrapper">
      <div className="quiz-progress">
        <div>
          <p>Question {currentIndex + 1} of {totalQuestions}</p>
          <p className={isTimeLow ? 'timer-warning' : ''}>
            Time: <strong>{timeRemaining}s / {questionTimeSeconds}s</strong>
          </p>
        </div>
        {isTimeLow && <p className="timer-warning-message">Hurry up! Time is almost over.</p>}
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
    </div>
  );
}
