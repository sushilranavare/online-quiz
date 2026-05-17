import { useState, createContext, useContext } from 'react';
import api from '../api/axios';
import { login as loginApi, register as registerApi, getProfile } from '../api/authApi';

export const AuthContext = createContext(null);

// Hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing token on mount
    useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    async function loadUser() {
        try {
            const response = await getProfile();
            if (response.success) {
                setUser(response.data);
            } else {
                logout();
            }
        } catch (err) {
            logout();
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        const response = await loginApi({ email, password });
        if (response.success) {
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return { success: true };
        }
        return response;
    }

    async function register(username, email, password, adminRegisterCode) {
        const response = await registerApi({ username, email, password, adminRegisterCode });
        if (response.success) {
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return { success: true };
        }
        return response;
    }

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    }

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            isAdmin,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;