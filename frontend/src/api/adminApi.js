import api from './axios';

const BASE_URL = '/admin/questions';

// Get all questions
export async function getQuestions(params = {}) {
    const response = await api.get(BASE_URL, { params });
    return response.data;
}

// Get question by ID
export async function getQuestion(id) {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
}

// Create question
export async function createQuestion(questionData) {
    const response = await api.post(BASE_URL, questionData);
    return response.data;
}

// Update question
export async function updateQuestion(id, questionData) {
    const response = await api.put(`${BASE_URL}/${id}`, questionData);
    return response.data;
}

// Delete question
export async function deleteQuestion(id) {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
}

// Toggle question status
export async function toggleQuestionStatus(id) {
    const response = await api.patch(`${BASE_URL}/${id}/toggle`);
    return response.data;
}

// Bulk import questions
export async function bulkImportQuestions(questions) {
    const response = await api.post(`${BASE_URL}/bulk`, { questions });
    return response.data;
}

// Get question statistics
export async function getQuestionStats() {
    const response = await api.get(`${BASE_URL}/stats`);
    return response.data;
}

export default {
    getQuestions,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    toggleQuestionStatus,
    bulkImportQuestions,
    getQuestionStats
};