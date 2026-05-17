import api from './axios';

export const leaderboardApi = {
  getLeaderboard: () => api.get('/leaderboard')
};

export default leaderboardApi;
