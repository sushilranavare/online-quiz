import { Link } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import QuizResult from '../components/quiz/QuizResult';

export default function ResultPage() {
  const { quizState, quizDispatch } = useQuiz();

  if (!quizState.result) {
    return (
      <section className="card">
        <h2>No result available</h2>
        <p>Please complete a quiz first.</p>
        <Link to="/quiz">Go to Quiz</Link>
      </section>
    );
  }

  function handleReset() {
    quizDispatch({ type: 'RESET_QUIZ' });
  }

  return (
    <section>
      <QuizResult result={quizState.result} />
      <div className="result-actions">
        <Link to="/attempts">View My Attempts</Link>
        <Link to="/leaderboard">View Leaderboard</Link>
        <Link to="/quiz" onClick={handleReset}>Try Another Quiz</Link>
      </div>
    </section>
  );
}
