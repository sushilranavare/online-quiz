import api from './axios';

export const scoreApi = {
  submitScore: (data) => api.post('/scores', data),
  getUserAttempts: () => api.get('/scores/me'),
  getMyAttempts: () => api.get('/scores/me'),
  getAttempt: (id) => api.get(`/scores/${id}`)
};

export default scoreApi;
