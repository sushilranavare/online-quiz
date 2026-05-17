import { useState, useEffect } from 'react';
import { getGlobalLeaderboard, getCategories } from '../api/leaderboardApi';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadLeaderboard();
    }, [selectedCategory, pagination.page]);

    async function loadCategories() {
        try {
            const response = await getCategories();
            if (response.success) {
                setCategories(response.data.categories);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    }

    async function loadLeaderboard(page = 1) {
        try {
            setLoading(true);
            let response;
            if (selectedCategory) {
                response = await getGlobalLeaderboard({ ...(selectedCategory && { category: selectedCategory }), page, limit: 20 });
            } else {
                response = await getGlobalLeaderboard({ page, limit: 20 });
            }
            if (response.success) {
                setLeaderboard(response.data.leaderboard);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            setError(err.message || 'Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    }

    function handleCategoryChange(category) {
        setSelectedCategory(category);
        setPagination(prev => ({ ...prev, page: 1 }));
    }

    function handlePageChange(page) {
        setPagination(prev => ({ ...prev, page }));
    }

    return (
        <div className="leaderboard-page">
            <div className="page-header">
                <h1>Leaderboard</h1>
                <div className="category-filter">
                    <select
                        value={selectedCategory}
                        onChange={e => handleCategoryChange(e.target.value)}
                        className="category-select"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading leaderboard...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <LeaderboardTable
                    leaderboard={leaderboard}
                    selectedCategory={selectedCategory}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}