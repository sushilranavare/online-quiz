import Navbar from './Navbar';
import { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useQuiz } from '../../hooks/useQuiz';

export default function Layout({ children }) {
    const { isAuthenticated, user } = useAuth();
    const { dispatch } = useQuiz();
    const prevUserIdRef = useRef(null);

    useEffect(() => {
        const currentUserId = user?.id || user?._id || null;

        if (!isAuthenticated) {
            dispatch({ type: 'RESET_QUIZ' });
            prevUserIdRef.current = null;
            return;
        }

        if (prevUserIdRef.current && prevUserIdRef.current !== currentUserId) {
            dispatch({ type: 'RESET_QUIZ' });
        }
        prevUserIdRef.current = currentUserId;
    }, [dispatch, isAuthenticated, user]);

    return (
        <div className="app-shell">
            <Navbar />
            <main className="container">{children}</main>
        </div>
    );
}
