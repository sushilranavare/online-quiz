import api from './axios';

const BASE_URL = '/quiz';

// Get categories
export async function getCategories() {
    const response = await api.get(`${BASE_URL}/categories`);
    return response.data;
}

// Get questions by category
export async function getQuestions(category) {
    const response = await api.get(`${BASE_URL}/${category}`);
    return response.data;
}

export default {
    getCategories,
    getQuestions
};