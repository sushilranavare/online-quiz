import api from './axios';

const BASE_URL = '/scores';

// Get user's attempts
export async function getUserAttempts(params = {}) {
    const response = await api.get(BASE_URL, { params });
    return response.data;
}

// Get attempt by ID
export async function getAttempt(id) {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
}

// Submit score
export async function submitScore(scoreData) {
    const response = await api.post(BASE_URL, scoreData);
    return response.data;
}

export default {
    getUserAttempts,
    getAttempt,
    submitScore
};