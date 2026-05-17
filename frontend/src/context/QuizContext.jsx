import { createContext, useContext, useReducer } from 'react';

export const QuizContext = createContext(null);

export const quizInitialState = {
  questions: [],
  currentIndex: 0,
  answers: [],
  result: null,
  isStarted: false,
  questionTimeSeconds: 30
};

export function quizReducer(state, action) {
  switch (action.type) {
    case 'START_QUIZ':
      return {
        questions: action.payload.questions,
        currentIndex: 0,
        answers: [],
        result: null,
        isStarted: true,
        questionTimeSeconds: action.payload.questionTimeSeconds || 30
      };
    case 'SAVE_ANSWER': {
      const existingAnswerIndex = state.answers.findIndex(
        (answer) => answer.questionId === action.payload.questionId
      );
      const updatedAnswers = [...state.answers];

      if (existingAnswerIndex >= 0) updatedAnswers[existingAnswerIndex] = action.payload;
      else updatedAnswers.push(action.payload);

      return { ...state, answers: updatedAnswers };
    }
    case 'NEXT_QUESTION':
      return { ...state, currentIndex: state.currentIndex + 1 };
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    case 'RESET_QUIZ':
      return quizInitialState;
    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, quizInitialState);

  return (
    <QuizContext.Provider value={{ state, dispatch, quizState: state, quizDispatch: dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within QuizProvider');
  return context;
}

export default QuizProvider;
