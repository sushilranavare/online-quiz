import api from './axios';

export const adminApi = {
  getDashboard: () => api.get('/admin/quizzes/dashboard'),
  getQuizzes: () => api.get('/admin/quizzes'),
  createQuiz: (data) => api.post('/admin/quizzes', data),
  updateQuiz: (id, data) => api.put(`/admin/quizzes/${id}`, data),
  toggleQuiz: (id) => api.patch(`/admin/quizzes/${id}/toggle`),
  deleteQuiz: (id) => api.delete(`/admin/quizzes/${id}`),
  getQuestions: (quizId) => api.get('/admin/questions', { params: { quizId } }),
  createQuestion: (data) => api.post('/admin/questions', data),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  toggleQuestionStatus: (id) => api.patch(`/admin/questions/${id}/toggle`),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),
  importQuestions: (quizId, questions) => api.post('/admin/questions/import', { quizId, questions })
};

export default adminApi;
