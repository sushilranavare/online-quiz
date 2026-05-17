import api from './axios';

const BASE_URL = '/leaderboard';

// Get global leaderboard
export async function getGlobalLeaderboard(params = {}) {
    const response = await api.get(BASE_URL, { params });
    return response.data;
}

// Get category leaderboard
export async function getCategoryLeaderboard(category, params = {}) {
    const response = await api.get(`${BASE_URL}/category/${category}`, { params });
    return response.data;
}

// Get user rank
export async function getUserRank(userId) {
    const response = await api.get(`${BASE_URL}/rank/${userId}`);
    return response.data;
}

// Get available categories
export async function getCategories() {
    const response = await api.get(`${BASE_URL}/categories`);
    return response.data;
}

export default {
    getGlobalLeaderboard,
    getCategoryLeaderboard,
    getUserRank,
    getCategories
};