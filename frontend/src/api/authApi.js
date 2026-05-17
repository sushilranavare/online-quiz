import api from './axios';

const BASE_URL = '/auth';

// Register
export async function register(userData) {
    const response = await api.post(`${BASE_URL}/register`, userData);
    return response.data;
}

// Login
export async function login(credentials) {
    const response = await api.post(`${BASE_URL}/login`, credentials);
    return response.data;
}

// Get profile
export async function getProfile() {
    const response = await api.get(`${BASE_URL}/profile`);
    return response.data;
}

// Update profile
export async function updateProfile(data) {
    const response = await api.put(`${BASE_URL}/profile`, data);
    return response.data;
}

export default {
    register,
    login,
    getProfile,
    updateProfile
};