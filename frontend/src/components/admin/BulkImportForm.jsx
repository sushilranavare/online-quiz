import { useState } from 'react';
import { bulkImportQuestions } from '../../api/adminApi';

export default function BulkImportForm({ onSuccess, onCancel }) {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    function validateJSON(str) {
        try {
            const data = JSON.parse(str);
            if (!Array.isArray(data)) {
                return { valid: false, error: 'Input must be a JSON array of questions' };
            }
            return { valid: true, data };
        } catch (e) {
            return { valid: false, error: 'Invalid JSON format' };
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setResult(null);

        const validation = validateJSON(jsonInput);
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        try {
            setSubmitting(true);
            const response = await bulkImportQuestions(validation.data);
            if (response.success) {
                setResult(response.data);
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }
        } catch (err) {
            setError(err.message || 'Failed to import questions');
        } finally {
            setSubmitting(false);
        }
    }

    function loadSampleData() {
        const sample = [
            {
                category: "Science",
                questionText: "What is the chemical symbol for water?",
                options: ["H2O", "CO2", "NaCl", "O2"],
                correctOption: 0,
                difficulty: "easy"
            },
            {
                category: "History",
                questionText: "In which year did World War II end?",
                options: ["1943", "1944", "1945", "1946"],
                correctOption: 2,
                difficulty: "medium"
            }
        ];
        setJsonInput(JSON.stringify(sample, null, 2));
    }

    return (
        <form onSubmit={handleSubmit} className="bulk-import-form">
            <h2>Bulk Import Questions</h2>
            <p className="form-description">
                Paste a JSON array of question objects. Each object should have: 
                category, questionText, options (array of 4), correctOption (0-3), and optional difficulty.
            </p>

            {error && <div className="form-error">{error}</div>}
            {result && (
                <div className="form-success">
                    Successfully imported {result.imported} of {result.total} questions!
                    {result.errors && result.errors.length > 0 && (
                        <p>{result.errors.length} questions had errors.</p>
                    )}
                </div>
            )}

            <div className="form-group">
                <label>Questions JSON</label>
                <textarea
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    rows={15}
                    placeholder='[{"category": "Science", "questionText": "...", "options": ["A", "B", "C", "D"], "correctOption": 0}]'
                    className={error ? 'error' : ''}
                />
            </div>

            <div className="form-actions">
                <button type="button" onClick={loadSampleData} className="btn btn-secondary">
                    Load Sample
                </button>
                <div className="action-right">
                    <button type="button" onClick={onCancel} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="btn btn-primary">
                        {submitting ? 'Importing...' : 'Import Questions'}
                    </button>
                </div>
            </div>
        </form>
    );
}