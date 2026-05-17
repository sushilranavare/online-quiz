import { useQuiz as useQuizContext } from '../context/QuizContext';

export function useQuiz() {
  return useQuizContext();
}

export default useQuiz;
