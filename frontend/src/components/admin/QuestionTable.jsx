export default function QuestionTable({ questions, onEdit, onDelete, onToggle, pagination, onPageChange }) {
    if (!questions || questions.length === 0) {
        return <div className="empty-state">No questions found</div>;
    }

    return (
        <div className="question-table-container">
            <table className="question-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Question</th>
                        <th>Difficulty</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {questions.map(q => (
                        <tr key={q._id}>
                            <td>
                                <span className={`category-badge ${q.category.toLowerCase()}`}>
                                    {q.category}
                                </span>
                            </td>
                            <td className="question-cell">
                                <p className="question-text">{q.questionText}</p>
                                <p className="question-options">
                                    {q.options.map((opt, i) => (
                                        <span key={i} className={i === q.correctOption ? 'correct' : ''}>
                                            {String.fromCharCode(65 + i)}. {opt}
                                        </span>
                                    ))}
                                </p>
                            </td>
                            <td>
                                <span className={`difficulty-badge ${q.difficulty}`}>
                                    {q.difficulty}
                                </span>
                            </td>
                            <td>
                                <button
                                    onClick={() => onToggle(q._id)}
                                    className={`status-toggle ${q.isActive ? 'active' : 'inactive'}`}
                                >
                                    {q.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </td>
                            <td>
                                <button onClick={() => onEdit(q)} className="btn btn-sm btn-primary">
                                    Edit
                                </button>
                                <button onClick={() => onDelete(q._id)} className="btn btn-sm btn-danger">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => onPageChange(pagination.page - 1)}
                        className="btn btn-sm"
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => onPageChange(pagination.page + 1)}
                        className="btn btn-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}