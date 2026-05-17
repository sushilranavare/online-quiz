import { Link, useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { submitScore } from '../api/scoreApi';
import QuizResult from '../components/quiz/QuizResult';

export default function ResultPage() {
    const { state, dispatch } = useQuiz();
    const navigate = useNavigate();

    async function handleSubmitScore() {
        try {
            await submitScore({
                score: state.score,
                totalQuestions: state.questions.length,
                category: state.category,
                answers: state.answers,
                timeSpent: state.timeSpent
            });
        } catch (err) {
            console.error('Failed to save score:', err);
        }
    }

    function handlePlayAgain() {
        dispatch({ type: 'RESET_QUIZ' });
        navigate('/quiz');
    }

    function handleGoHome() {
        dispatch({ type: 'RESET_QUIZ' });
        navigate('/');
    }

    // Calculate score if not already done
    const correctAnswers = state.answers.filter(a => a.isCorrect).length;
    const scorePercentage = Math.round((correctAnswers / state.questions.length) * 100);

    return (
        <div className="result-page">
            <QuizResult
                score={correctAnswers}
                total={state.questions.length}
                percentage={scorePercentage}
            />

            <div className="result-actions">
                <button onClick={handlePlayAgain} className="btn btn-primary">
                    Play Again
                </button>
                <button onClick={handleGoHome} className="btn btn-secondary">
                    Back to Home
                </button>
            </div>

            <div className="result-links">
                <Link to="/attempts">View My Attempts</Link>
                <Link to="/leaderboard">View Leaderboard</Link>
            </div>
        </div>
    );
}