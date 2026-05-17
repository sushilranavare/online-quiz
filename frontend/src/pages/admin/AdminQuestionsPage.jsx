import { useState, useEffect } from 'react';
import { getQuestions, deleteQuestion, toggleQuestionStatus } from '../../api/adminApi';
import QuestionTable from '../../components/admin/QuestionTable';
import QuestionForm from '../../components/admin/QuestionForm';
import BulkImportForm from '../../components/admin/BulkImportForm';

export default function AdminQuestionsPage() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [filter, setFilter] = useState({ category: '', isActive: '' });
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    useEffect(() => {
        loadQuestions();
    }, [filter, pagination.page]);

    async function loadQuestions(page = 1) {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 20,
                ...(filter.category && { category: filter.category }),
                ...(filter.isActive && { isActive: filter.isActive === 'true' })
            };
            const response = await getQuestions(params);
            if (response.success) {
                setQuestions(response.data.questions);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            setError(err.message || 'Failed to load questions');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            const response = await deleteQuestion(id);
            if (response.success) {
                loadQuestions(pagination.page);
            }
        } catch (err) {
            alert(err.message || 'Failed to delete question');
        }
    }

    async function handleToggle(id) {
        try {
            const response = await toggleQuestionStatus(id);
            if (response.success) {
                loadQuestions(pagination.page);
            }
        } catch (err) {
            alert(err.message || 'Failed to toggle question status');
        }
    }

    function handleEdit(question) {
        setEditingQuestion(question);
        setShowForm(true);
    }

    function handleAddNew() {
        setEditingQuestion(null);
        setShowForm(true);
    }

    function handleFormClose() {
        setShowForm(false);
        setEditingQuestion(null);
    }

    function handleFormSuccess() {
        setShowForm(false);
        setEditingQuestion(null);
        loadQuestions(pagination.page);
    }

    function handleBulkImportSuccess() {
        setShowBulkImport(false);
        loadQuestions();
    }

    return (
        <div className="admin-questions-page">
            <div className="page-header">
                <h1>Manage Questions</h1>
                <div className="header-actions">
                    <button onClick={handleAddNew} className="btn btn-primary">
                        Add Question
                    </button>
                    <button onClick={() => setShowBulkImport(true)} className="btn btn-secondary">
                        Bulk Import
                    </button>
                </div>
            </div>

            <div className="filters">
                <select 
                    value={filter.category} 
                    onChange={e => setFilter({ ...filter, category: e.target.value })}
                >
                    <option value="">All Categories</option>
                    <option value="Geography">Geography</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Sports">Sports</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Technology">Technology</option>
                </select>
                <select 
                    value={filter.isActive} 
                    onChange={e => setFilter({ ...filter, isActive: e.target.value })}
                >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>

            {loading ? (
                <div className="loading">Loading questions...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <QuestionTable
                    questions={questions}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    pagination={pagination}
                    onPageChange={page => loadQuestions(page)}
                />
            )}

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={handleFormClose}>X</button>
                        <QuestionForm
                            question={editingQuestion}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormClose}
                        />
                    </div>
                </div>
            )}

            {showBulkImport && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setShowBulkImport(false)}>X</button>
                        <BulkImportForm
                            onSuccess={handleBulkImportSuccess}
                            onCancel={() => setShowBulkImport(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}