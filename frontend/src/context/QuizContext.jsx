import { createContext, useReducer, useContext } from 'react';

export const QuizContext = createContext(null);

// Hook to use quiz context
export function useQuiz() {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuiz must be used within QuizProvider');
    }
    return context;
}

const initialState = {
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    score: 0,
    timeSpent: 0,
    category: null,
    status: 'idle' // idle, loading, in_progress, completed
};

function quizReducer(state, action) {
    switch (action.type) {
        case 'SET_QUESTIONS':
            return {
                ...state,
                questions: action.payload,
                status: 'in_progress',
                currentQuestionIndex: 0,
                answers: [],
                score: 0
            };
        case 'SET_CATEGORY':
            return { ...state, category: action.payload };
        case 'ANSWER_QUESTION':
            return {
                ...state,
                answers: [...state.answers, action.payload],
                currentQuestionIndex: state.currentQuestionIndex + 1
            };
        case 'UPDATE_SCORE':
            return { ...state, score: action.payload };
        case 'UPDATE_TIME':
            return { ...state, timeSpent: action.payload };
        case 'COMPLETE_QUIZ':
            return { ...state, status: 'completed' };
        case 'RESET_QUIZ':
            return { ...initialState };
        default:
            return state;
    }
}

export function QuizProvider({ children }) {
    const [state, dispatch] = useReducer(quizReducer, initialState);

    return (
        <QuizContext.Provider value={{ state, dispatch }}>
            {children}
        </QuizContext.Provider>
    );
}

export default QuizProvider;