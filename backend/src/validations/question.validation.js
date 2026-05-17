// Question validation schemas

const validCategories = ['Geography', 'Science', 'History', 'Sports', 'Entertainment', 'Technology'];
const validDifficulties = ['easy', 'medium', 'hard'];

export function validateQuestion(req, res, next) {
    const { category, questionText, options, correctOption, difficulty } = req.body;
    const errors = [];

    // Category validation
    if (!category) {
        errors.push('Category is required');
    } else if (!validCategories.includes(category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Question text validation
    if (!questionText) {
        errors.push('Question text is required');
    } else if (typeof questionText !== 'string' || questionText.trim().length < 5) {
        errors.push('Question text must be at least 5 characters');
    } else if (questionText.length > 500) {
        errors.push('Question text cannot exceed 500 characters');
    }

    // Options validation
    if (!options) {
        errors.push('Options are required');
    } else if (!Array.isArray(options)) {
        errors.push('Options must be an array');
    } else if (options.length !== 4) {
        errors.push('Must have exactly 4 options');
    } else {
        for (let i = 0; i < options.length; i++) {
            if (!options[i] || typeof options[i] !== 'string' || options[i].trim().length === 0) {
                errors.push(`Option ${i + 1} cannot be empty`);
            }
        }
    }

    // Correct option validation
    if (correctOption === undefined || correctOption === null) {
        errors.push('Correct option index is required');
    } else if (typeof correctOption !== 'number' || correctOption < 0 || correctOption > 3) {
        errors.push('Correct option must be a number between 0 and 3');
    }

    // Difficulty validation (optional)
    if (difficulty && !validDifficulties.includes(difficulty)) {
        errors.push(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }

    // Sanitize inputs
    req.body.category = category.trim();
    req.body.questionText = questionText.trim();
    req.body.options = options.map(o => o.trim());
    req.body.difficulty = difficulty || 'medium';

    next();
}

export function validateBulkImport(req, res, next) {
    const { questions } = req.body;
    const errors = [];

    if (!questions) {
        errors.push('Questions array is required');
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }

    if (!Array.isArray(questions)) {
        errors.push('Questions must be an array');
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }

    if (questions.length === 0) {
        errors.push('Questions array cannot be empty');
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }

    if (questions.length > 100) {
        errors.push('Cannot import more than 100 questions at once');
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionErrors = [];

        if (!q.category || !validCategories.includes(q.category)) {
            questionErrors.push(`Invalid category at index ${i}`);
        }
        if (!q.questionText || q.questionText.trim().length < 5) {
            questionErrors.push(`Invalid question text at index ${i}`);
        }
        if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
            questionErrors.push(`Invalid options at index ${i}`);
        }
        if (q.correctOption === undefined || q.correctOption < 0 || q.correctOption > 3) {
            questionErrors.push(`Invalid correctOption at index ${i}`);
        }
        if (q.difficulty && !validDifficulties.includes(q.difficulty)) {
            questionErrors.push(`Invalid difficulty at index ${i}`);
        }

        if (questionErrors.length > 0) {
            errors.push(...questionErrors);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.slice(0, 10).join('; ') // Limit error messages
        });
    }

    next();
}