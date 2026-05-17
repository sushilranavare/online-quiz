import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../api/quizApi';
import { scoreApi } from '../api/scoreApi';
import { useQuiz } from '../hooks/useQuiz';
import QuestionCard from '../components/quiz/QuestionCard';
import QuizProgress from '../components/quiz/QuizProgress';

const NO_ANSWER = 'No Answer';

export default function QuizPage() {
  const navigate = useNavigate();
  const { quizState, quizDispatch } = useQuiz();

  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const isSubmittingRef = useRef(false);
  const currentQuestion = quizState.questions[quizState.currentIndex];
  const questionTimeSeconds = quizState.questionTimeSeconds || 30;

  const loadAvailableQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await quizApi.getAvailableQuizzes();
      setAvailableQuizzes(response.data.data.quizzes || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!quizState.isStarted) loadAvailableQuizzes();
  }, [loadAvailableQuizzes, quizState.isStarted]);

  const buildCompletedAnswers = useCallback(
    (latestAnswer = null) => {
      const answerMap = new Map();

      quizState.answers.forEach((answer) => {
        answerMap.set(answer.questionId, {
          selectedAnswer: answer.selectedAnswer,
          remainingTimeSeconds: answer.remainingTimeSeconds
        });
      });

      if (latestAnswer) {
        answerMap.set(latestAnswer.questionId, {
          selectedAnswer: latestAnswer.selectedAnswer,
          remainingTimeSeconds: latestAnswer.remainingTimeSeconds
        });
      }

      return quizState.questions.map((question) => {
        const savedAnswer = answerMap.get(question._id);
        return {
          questionId: question._id,
          selectedAnswer: savedAnswer?.selectedAnswer || NO_ANSWER,
          remainingTimeSeconds: savedAnswer?.remainingTimeSeconds || 0
        };
      });
    },
    [quizState.answers, quizState.questions]
  );

  const submitTimedQuiz = useCallback(
    async (latestAnswer = null) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
        setLoading(true);
        setError('');

        const response = await scoreApi.submitScore({
          answers: buildCompletedAnswers(latestAnswer)
        });

        quizDispatch({ type: 'SET_RESULT', payload: response.data.data.attempt });
        navigate('/result');
      } catch (err) {
        isSubmittingRef.current = false;
        setError(err.response?.data?.error || 'Failed to submit quiz. Please login again and retry.');
      } finally {
        setLoading(false);
      }
    },
    [buildCompletedAnswers, navigate, quizDispatch]
  );

  const saveAnswerAndMove = useCallback(
    async (selectedValue, remainingSeconds) => {
      if (!currentQuestion) return;

      const currentAnswer = {
        questionId: currentQuestion._id,
        selectedAnswer: selectedValue || NO_ANSWER,
        remainingTimeSeconds: selectedValue ? remainingSeconds : 0
      };

      quizDispatch({ type: 'SAVE_ANSWER', payload: currentAnswer });

      const isLastQuestion = quizState.currentIndex === quizState.questions.length - 1;
      if (isLastQuestion) {
        await submitTimedQuiz(currentAnswer);
        return;
      }

      quizDispatch({ type: 'NEXT_QUESTION' });
      setSelectedAnswer('');
      setFeedback('');
      setTimeRemaining(questionTimeSeconds);
    },
    [currentQuestion, questionTimeSeconds, quizDispatch, quizState.currentIndex, quizState.questions.length, submitTimedQuiz]
  );

  useEffect(() => {
    if (!quizState.isStarted || quizState.result || isSubmittingRef.current) return;

    if (timeRemaining <= 0) {
      setFeedback('Time is up! Moving to the next question...');
      saveAnswerAndMove(selectedAnswer || NO_ANSWER, 0);
      return;
    }

    const timerId = setTimeout(() => setTimeRemaining((current) => current - 1), 1000);
    return () => clearTimeout(timerId);
  }, [quizState.isStarted, quizState.result, saveAnswerAndMove, selectedAnswer, timeRemaining]);

  async function handleStartQuiz(quiz) {
    try {
      setLoading(true);
      setError('');
      setFeedback('');
      isSubmittingRef.current = false;

      const response = await quizApi.getQuestions(quiz._id);
      setSelectedQuiz(response.data.data.quiz || quiz);

      quizDispatch({
        type: 'START_QUIZ',
        payload: {
          questions: response.data.data.questions,
          questionTimeSeconds: response.data.data.questionTimeSeconds
        }
      });

      setSelectedAnswer('');
      setTimeRemaining(response.data.data.questionTimeSeconds || 30);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAnswer(answer) {
    setFeedback('');
    setSelectedAnswer(answer);
  }

  async function handleNextOrSubmit() {
    if (!currentQuestion) return;
    if (!selectedAnswer) {
      setError('Please select one answer');
      return;
    }

    setError('');
    setFeedback('');
    await saveAnswerAndMove(selectedAnswer, timeRemaining);
  }

  if (!quizState.isStarted) {
    return (
      <section className="card">
        <h2>Available Quizzes</h2>
        <p>Choose one active quiz to start. A quiz is playable only when it has 6 to 15 active questions.</p>

        {error && <p className="error-message">{error}</p>}
        {loading && <p>Loading quizzes...</p>}

        <div className="quiz-card-grid">
          {availableQuizzes.map((quiz) => (
            <article key={quiz._id} className="quiz-admin-card">
              <div className="quiz-card-title-row">
                <h3>{quiz.name}</h3>
                <span className={quiz.isPlayable ? 'badge active' : 'badge inactive'}>
                  {quiz.isPlayable ? 'Ready' : 'Not Ready'}
                </span>
              </div>

              <p>{quiz.description || 'No description added.'}</p>

              <div className="quiz-card-stats">
                <span>Questions: {quiz.activeQuestions}</span>
                <span>Time: 30 seconds per question</span>
              </div>

              {!quiz.isPlayable && <p className="error-message">This quiz is not ready yet.</p>}

              <button type="button" onClick={() => handleStartQuiz(quiz)} disabled={!quiz.isPlayable || loading}>
                Start Quiz
              </button>
            </article>
          ))}

          {!availableQuizzes.length && !loading && (
            <div className="empty-state">No active quizzes are available yet.</div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      {selectedQuiz && (
        <div className="card">
          <h2>{selectedQuiz.name}</h2>
          {selectedQuiz.description && <p>{selectedQuiz.description}</p>}
        </div>
      )}

      <QuizProgress
        currentIndex={quizState.currentIndex}
        totalQuestions={quizState.questions.length}
        timeRemaining={timeRemaining}
        questionTimeSeconds={questionTimeSeconds}
      />

      {feedback && <p className="quiz-feedback">{feedback}</p>}
      {currentQuestion && <QuestionCard question={currentQuestion} selectedAnswer={selectedAnswer} onSelectAnswer={handleSelectAnswer} />}
      {error && <p className="error-message">{error}</p>}

      <button onClick={handleNextOrSubmit} disabled={loading}>
        {quizState.currentIndex === quizState.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
      </button>
    </section>
  );
}
