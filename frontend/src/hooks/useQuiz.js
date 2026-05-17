import { useContext } from 'react';
import { QuizContext } from '../context/QuizContext';

export function useQuiz() {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuiz must be used within QuizProvider');
    }
    return context;
}

export default useQuiz;