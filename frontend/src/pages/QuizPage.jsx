import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { getQuestions } from '../api/quizApi';
import QuestionCard from '../components/quiz/QuestionCard';
import QuizProgress from '../components/quiz/QuizProgress';

const categories = ['Geography', 'Science', 'History', 'Sports', 'Entertainment', 'Technology'];

export default function QuizPage() {
    const [searchParams] = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { state, dispatch } = useQuiz();
    const navigate = useNavigate();

    useEffect(() => {
        if (!selectedCategory) return;
        
        loadQuestions();
    }, [selectedCategory]);

    async function loadQuestions() {
        try {
            setLoading(true);
            setError(null);
            const response = await getQuestions(selectedCategory);
            if (response.success) {
                dispatch({ type: 'SET_CATEGORY', payload: selectedCategory });
                dispatch({ type: 'SET_QUESTIONS', payload: response.data.questions });
            }
        } catch (err) {
            setError(err.message || 'Failed to load questions');
        } finally {
            setLoading(false);
        }
    }

    function handleAnswer(questionId, selectedOption, isCorrect) {
        dispatch({
            type: 'ANSWER_QUESTION',
            payload: { questionId, selectedOption, isCorrect }
        });

        // Check if quiz is complete
        if (state.currentQuestionIndex >= state.questions.length - 1) {
            dispatch({ type: 'COMPLETE_QUIZ' });
            navigate('/result');
        }
    }

    if (!selectedCategory) {
        return (
            <div className="quiz-page">
                <h1>Select a Category</h1>
                <div className="category-select">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="btn btn-lg"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="loading">Loading questions...</div>;
    }

    if (error) {
        return (
            <div className="error-state">
                <p>{error}</p>
                <button onClick={() => setSelectedCategory('')} className="btn btn-secondary">
                    Go Back
                </button>
            </div>
        );
    }

    const currentQuestion = state.questions[state.currentQuestionIndex];

    return (
        <div className="quiz-page">
            <QuizProgress
                current={state.currentQuestionIndex + 1}
                total={state.questions.length}
                category={selectedCategory}
            />
            
            {currentQuestion && (
                <QuestionCard
                    question={currentQuestion}
                    onAnswer={handleAnswer}
                />
            )}
        </div>
    );
}