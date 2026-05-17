import { useState, useEffect } from 'react';
import { createQuestion, updateQuestion } from '../../api/adminApi';

const categories = ['Geography', 'Science', 'History', 'Sports', 'Entertainment', 'Technology'];
const difficulties = ['easy', 'medium', 'hard'];

export default function QuestionForm({ question, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        category: '',
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        difficulty: 'medium'
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (question) {
            setFormData({
                category: question.category,
                questionText: question.questionText,
                options: [...question.options],
                correctOption: question.correctOption,
                difficulty: question.difficulty || 'medium'
            });
        }
    }, [question]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function handleOptionChange(index, value) {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData(prev => ({ ...prev, options: newOptions }));
        setErrors(prev => ({ ...prev, options: null }));
    }

    function validate() {
        const newErrors = {};
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.questionText.trim()) newErrors.questionText = 'Question text is required';
        if (formData.questionText.length < 5) newErrors.questionText = 'Question must be at least 5 characters';
        if (formData.options.some(o => !o.trim())) newErrors.options = 'All options are required';
        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setSubmitting(true);
            const response = question
                ? await updateQuestion(question._id, formData)
                : await createQuestion(formData);
            
            if (response.success) {
                onSuccess();
            }
        } catch (err) {
            setErrors({ submit: err.message || 'Failed to save question' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="question-form">
            <h2>{question ? 'Edit Question' : 'Add Question'}</h2>

            {errors.submit && <div className="form-error">{errors.submit}</div>}

            <div className="form-group">
                <label>Category</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={errors.category ? 'error' : ''}
                >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}
            </div>

            <div className="form-group">
                <label>Question Text</label>
                <textarea
                    name="questionText"
                    value={formData.questionText}
                    onChange={handleChange}
                    rows={3}
                    className={errors.questionText ? 'error' : ''}
                />
                {errors.questionText && <span className="field-error">{errors.questionText}</span>}
            </div>

            <div className="form-group">
                <label>Options</label>
                {formData.options.map((opt, idx) => (
                    <div key={idx} className="option-input">
                        <span className="option-label">{String.fromCharCode(65 + idx)}.</span>
                        <input
                            type="text"
                            value={opt}
                            onChange={e => handleOptionChange(idx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        />
                        <label className="correct-radio">
                            <input
                                type="radio"
                                name="correctOption"
                                checked={formData.correctOption === idx}
                                onChange={() => setFormData(prev => ({ ...prev, correctOption: idx }))}
                            />
                            Correct
                        </label>
                    </div>
                ))}
                {errors.options && <span className="field-error">{errors.options}</span>}
            </div>

            <div className="form-group">
                <label>Difficulty</label>
                <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                >
                    {difficulties.map(diff => (
                        <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                    ))}
                </select>
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn btn-secondary">
                    Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Saving...' : (question ? 'Update' : 'Create')}
                </button>
            </div>
        </form>
    );
}