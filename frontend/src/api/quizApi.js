import api from './axios';

export const quizApi = {
  getAvailableQuizzes: () => api.get('/quiz/available'),
  getQuestions: (quizId = '') => (quizId ? api.get(`/quiz/${quizId}`) : api.get('/quiz'))
};

export default quizApi;
