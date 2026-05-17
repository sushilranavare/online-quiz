import { useEffect, useState } from 'react';
import api from '../../api/axios';

const emptyQuizForm = { name: '', description: '', isActive: false };
const emptyQuestionForm = { questionText: '', options: ['', '', '', ''], correctAnswer: '', isActive: false };

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState(emptyQuizForm);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionStats, setQuestionStats] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadQuizzes() {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/quizzes');
      const loaded = response.data.data.quizzes || [];
      setQuizzes(loaded);
      if (selectedQuiz) setSelectedQuiz(loaded.find((quiz) => quiz._id === selectedQuiz._id) || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(quizId) {
    if (!quizId) return;
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/questions', { params: { quizId } });
      setQuestions(response.data.data.questions || []);
      setQuestionStats(response.data.data.stats || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => { if (selectedQuiz?._id) loadQuestions(selectedQuiz._id); }, [selectedQuiz?._id]);

  function handleQuizFormChange(event) {
    const { name, value, type, checked } = event.target;
    setQuizForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleQuestionFormChange(event) {
    const { name, value, type, checked } = event.target;
    setQuestionForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleOptionChange(index, value) {
    setQuestionForm((current) => {
      const options = [...current.options];
      options[index] = value;
      return { ...current, options };
    });
  }

  function resetQuizForm() { setQuizForm(emptyQuizForm); setEditingQuizId(null); }
  function resetQuestionForm() { setQuestionForm(emptyQuestionForm); setEditingQuestionId(null); }

  async function handleQuizSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true); setMessage(''); setError('');
      if (editingQuizId) {
        await api.put(`/admin/quizzes/${editingQuizId}`, quizForm);
        setMessage('Quiz updated successfully');
      } else {
        await api.post('/admin/quizzes', quizForm);
        setMessage('Quiz created successfully');
      }
      resetQuizForm();
      await loadQuizzes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save quiz');
    } finally { setLoading(false); }
  }

  function handleEditQuiz(quiz) {
    setEditingQuizId(quiz._id);
    setQuizForm({ name: quiz.name || '', description: quiz.description || '', isActive: quiz.isActive === true });
  }

  async function handleToggleQuiz(quizId) {
    try {
      setLoading(true); setMessage(''); setError('');
      await api.patch(`/admin/quizzes/${quizId}/toggle`);
      setMessage('Quiz status updated');
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to update quiz'); }
    finally { setLoading(false); }
  }

  async function handleDeleteQuiz(quizId) {
    if (!window.confirm('Delete this quiz and all questions inside it?')) return;
    try {
      setLoading(true); setMessage(''); setError('');
      await api.delete(`/admin/quizzes/${quizId}`);
      setSelectedQuiz(null); setQuestions([]); setQuestionStats(null);
      setMessage('Quiz deleted successfully');
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to delete quiz'); }
    finally { setLoading(false); }
  }

  async function handleQuestionSubmit(event) {
    event.preventDefault();
    if (!selectedQuiz) { setError('Please select a quiz first'); return; }
    try {
      setLoading(true); setMessage(''); setError('');
      const payload = { ...questionForm, quizId: selectedQuiz._id };
      if (editingQuestionId) {
        await api.put(`/admin/questions/${editingQuestionId}`, payload);
        setMessage('Question updated successfully');
      } else {
        await api.post('/admin/questions', payload);
        setMessage('Question added successfully');
      }
      resetQuestionForm();
      await loadQuestions(selectedQuiz._id);
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save question'); }
    finally { setLoading(false); }
  }

  function handleEditQuestion(question) {
    setEditingQuestionId(question._id);
    setQuestionForm({ questionText: question.questionText || '', options: question.options || ['', '', '', ''], correctAnswer: question.correctAnswer || '', isActive: question.isActive === true });
  }

  async function handleToggleQuestion(questionId) {
    try {
      setLoading(true); setMessage(''); setError('');
      await api.patch(`/admin/questions/${questionId}/toggle`);
      setMessage('Question status updated');
      await loadQuestions(selectedQuiz._id);
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to update question'); }
    finally { setLoading(false); }
  }

  async function handleDeleteQuestion(questionId) {
    if (!window.confirm('Delete this question?')) return;
    try {
      setLoading(true); setMessage(''); setError('');
      await api.delete(`/admin/questions/${questionId}`);
      setMessage('Question deleted successfully');
      await loadQuestions(selectedQuiz._id);
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to delete question'); }
    finally { setLoading(false); }
  }

  async function handleImportQuestions() {
    if (!selectedQuiz) { setError('Please select a quiz first'); return; }
    try {
      setLoading(true); setMessage(''); setError('');
      const questionsToImport = JSON.parse(jsonInput);
      await api.post('/admin/questions/import', { quizId: selectedQuiz._id, questions: questionsToImport });
      setJsonInput(''); setMessage('Questions imported successfully');
      await loadQuestions(selectedQuiz._id);
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || err.message || 'Failed to import questions'); }
    finally { setLoading(false); }
  }

  return (
    <section className="card admin-page">
      <div className="admin-header"><div><h2>Quiz Management</h2><p>Create quizzes and manage questions inside each quiz.</p></div></div>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form className="admin-form admin-form-grid" onSubmit={handleQuizSubmit}>
        <h3>{editingQuizId ? 'Edit Quiz' : 'Create Quiz'}</h3>
        <label>Quiz Name<input name="name" value={quizForm.name} onChange={handleQuizFormChange} required /></label>
        <label className="full-span">Description<textarea name="description" value={quizForm.description} onChange={handleQuizFormChange} rows="3" /></label>
        <label className="checkbox-row"><input name="isActive" type="checkbox" checked={quizForm.isActive} onChange={handleQuizFormChange} /> Active quiz</label>
        <div className="actions full-span"><button type="submit" disabled={loading}>{editingQuizId ? 'Update Quiz' : 'Create Quiz'}</button>{editingQuizId && <button type="button" onClick={resetQuizForm}>Cancel Edit</button>}</div>
      </form>

      <h3>Existing Quizzes</h3>
      <div className="quiz-card-grid">
        {quizzes.map((quiz) => (
          <article key={quiz._id} className={selectedQuiz?._id === quiz._id ? 'quiz-admin-card selected-card' : 'quiz-admin-card'}>
            <div className="quiz-card-title-row"><h4>{quiz.name}</h4><span className={quiz.isActive ? 'badge active' : 'badge inactive'}>{quiz.isActive ? 'Active' : 'Inactive'}</span></div>
            <p>{quiz.description || 'No description added.'}</p>
            <div className="quiz-card-stats"><span>Total questions: {quiz.totalQuestions}</span><span>Active questions: {quiz.activeQuestions}</span><span>Inactive questions: {quiz.inactiveQuestions}</span></div>
            <div className="actions"><button type="button" onClick={() => setSelectedQuiz(quiz)}>Manage Questions</button><button type="button" onClick={() => handleEditQuiz(quiz)}>Edit Quiz</button><button type="button" onClick={() => handleToggleQuiz(quiz._id)}>{quiz.isActive ? 'Deactivate Quiz' : 'Activate Quiz'}</button><button type="button" onClick={() => handleDeleteQuiz(quiz._id)}>Delete</button></div>
          </article>
        ))}
        {!quizzes.length && !loading && <div className="empty-state">No quizzes created yet.</div>}
      </div>

      {selectedQuiz && (
        <section className="nested-admin-section">
          <div className="admin-header"><div><h3>Questions for: {selectedQuiz.name}</h3><p>Add, edit, activate, deactivate, delete, or import questions for this quiz.</p></div>{questionStats && <div className="mini-stats"><span>Total: {questionStats.total}</span><span>Active: {questionStats.active}</span><span>Inactive: {questionStats.inactive}</span></div>}</div>

          <form className="admin-form admin-form-grid" onSubmit={handleQuestionSubmit}>
            <h3>{editingQuestionId ? 'Edit Question' : 'Add Question'}</h3>
            <label className="full-span">Question Text<textarea name="questionText" value={questionForm.questionText} onChange={handleQuestionFormChange} rows="3" required /></label>
            {questionForm.options.map((option, index) => <label key={index}>Option {index + 1}<input value={option} onChange={(event) => handleOptionChange(index, event.target.value)} required /></label>)}
            <label>Correct Answer<select name="correctAnswer" value={questionForm.correctAnswer} onChange={handleQuestionFormChange} required><option value="">Select correct answer</option>{questionForm.options.map((option, index) => <option key={index} value={option}>{option || `Option ${index + 1}`}</option>)}</select></label>
            <label className="checkbox-row"><input name="isActive" type="checkbox" checked={questionForm.isActive} onChange={handleQuestionFormChange} /> Active question</label>
            <div className="actions full-span"><button type="submit" disabled={loading}>{editingQuestionId ? 'Update Question' : 'Add Question'}</button>{editingQuestionId && <button type="button" onClick={resetQuestionForm}>Cancel Edit</button>}</div>
          </form>

          <div className="admin-form">
            <h3>Import Questions from JSON</h3>
            <p>Paste an array of questions. Each question needs questionText, options, correctAnswer, and isActive.</p>
            <textarea value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} rows="8" placeholder='[{"questionText":"Example?","options":["A","B","C","D"],"correctAnswer":"A","isActive":true}]' />
            <div className="actions"><button type="button" onClick={handleImportQuestions}>Import Questions</button></div>
          </div>

          <h3>Existing Questions</h3>
          <div className="table-wrapper"><table className="admin-table"><thead><tr><th>Question</th><th>Status</th><th>Correct Answer</th><th>Actions</th></tr></thead><tbody>{questions.map((question) => <tr key={question._id}><td>{question.questionText}</td><td><span className={question.isActive ? 'badge active' : 'badge inactive'}>{question.isActive ? 'Active' : 'Inactive'}</span></td><td>{question.correctAnswer}</td><td><div className="table-actions"><button type="button" onClick={() => handleEditQuestion(question)}>Edit</button><button type="button" onClick={() => handleToggleQuestion(question._id)}>{question.isActive ? 'Deactivate' : 'Activate'}</button><button type="button" onClick={() => handleDeleteQuestion(question._id)}>Delete</button></div></td></tr>)}{!questions.length && <tr><td colSpan="4">No questions added for this quiz yet.</td></tr>}</tbody></table></div>
        </section>
      )}
    </section>
  );
}
