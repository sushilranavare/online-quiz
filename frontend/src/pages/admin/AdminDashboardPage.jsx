import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuestionStats } from '../../api/adminApi';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            const response = await getQuestionStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (err) {
            setError(err.message || 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Total Questions</h3>
                    <p className="stat-value">{stats?.total || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Active Questions</h3>
                    <p className="stat-value">{stats?.active || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Inactive Questions</h3>
                    <p className="stat-value">{stats?.inactive || 0}</p>
                </div>
            </div>

            <div className="dashboard-sections">
                <div className="dashboard-section">
                    <h2>Questions by Category</h2>
                    <div className="category-stats">
                        {stats?.byCategory?.map(cat => (
                            <div key={cat._id} className="category-item">
                                <span className="category-name">{cat._id}</span>
                                <span className="category-count">{cat.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Questions by Difficulty</h2>
                    <div className="difficulty-stats">
                        {stats?.byDifficulty?.map(diff => (
                            <div key={diff._id} className={`difficulty-item ${diff._id}`}>
                                <span className="difficulty-name">{diff._id}</span>
                                <span className="difficulty-count">{diff.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="dashboard-actions">
                <Link to="/admin/questions" className="btn btn-primary">
                    Manage Questions
                </Link>
            </div>
        </div>
    );
}