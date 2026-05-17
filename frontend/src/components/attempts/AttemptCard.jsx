export default function AttemptCard({ attempt }) {
  return (
    <article className="quiz-admin-card">
      <div className="quiz-card-title-row">
        <h3>Score: {attempt.score}</h3>
        <span className="badge active">
          {attempt.correctAnswers} / {attempt.totalQuestions}
        </span>
      </div>

      <p>Time bonus: +{attempt.timeBonus || 0}</p>
      <p>
        Completed at:{' '}
        {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : '-'}
      </p>

      {attempt.answers?.length > 0 && (
        <details>
          <summary>View submitted answers</summary>

          <ul>
            {attempt.answers.map((answer, index) => (
              <li key={`${answer.questionId?._id || answer.questionId}-${index}`}>
                <strong>
                  {answer.questionId?.questionText || `Question ${index + 1}`}:
                </strong>{' '}
                {answer.selectedAnswer}{' '}
                {answer.isCorrect ? '(Correct)' : '(Incorrect)'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
