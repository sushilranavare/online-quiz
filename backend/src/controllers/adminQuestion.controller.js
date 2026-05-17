import Question from '../models/Question.js';
import { ok, fail } from '../utils/apiResponse.js';

// Get all questions (for admin)
export async function getAllQuestions(req, res, next) {
    try {
        const { category, isActive, difficulty, page = 1, limit = 50 } = req.query;
        
        const filter = {};
        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (difficulty) filter.difficulty = difficulty;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [questions, total] = await Promise.all([
            Question.find(filter)
                .select('-__v')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Question.countDocuments(filter)
        ]);

        return ok(res, {
            questions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
}

// Get single question
export async function getQuestionById(req, res, next) {
    try {
        const question = await Question.findById(req.params.id);
        
        if (!question) {
            return fail(res, 'Question not found', 404);
        }

        return ok(res, question);
    } catch (error) {
        next(error);
    }
}

// Create new question
export async function createQuestion(req, res, next) {
    try {
        const { category, questionText, options, correctOption, difficulty } = req.body;

        const question = await Question.create({
            category,
            questionText,
            options,
            correctOption,
            difficulty
        });

        return ok(res, question, 201);
    } catch (error) {
        next(error);
    }
}

// Update question
export async function updateQuestion(req, res, next) {
    try {
        const { category, questionText, options, correctOption, difficulty, isActive } = req.body;

        const question = await Question.findByIdAndUpdate(
            req.params.id,
            { category, questionText, options, correctOption, difficulty, isActive },
            { new: true, runValidators: true }
        );

        if (!question) {
            return fail(res, 'Question not found', 404);
        }

        return ok(res, question);
    } catch (error) {
        next(error);
    }
}

// Delete question
export async function deleteQuestion(req, res, next) {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);

        if (!question) {
            return fail(res, 'Question not found', 404);
        }

        return ok(res, { message: 'Question deleted successfully' });
    } catch (error) {
        next(error);
    }
}

// Toggle question active status
export async function toggleQuestionStatus(req, res, next) {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return fail(res, 'Question not found', 404);
        }

        question.isActive = !question.isActive;
        await question.save();

        return ok(res, question);
    } catch (error) {
        next(error);
    }
}

// Bulk import questions
export async function bulkImportQuestions(req, res, next) {
    try {
        const { questions } = req.body;

        if (!Array.isArray(questions) || questions.length === 0) {
            return fail(res, 'Questions array is required and cannot be empty', 400);
        }

        const validQuestions = [];
        const errors = [];

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            if (!q.category || !q.questionText || !q.options || q.correctOption === undefined) {
                errors.push({ index: i, error: 'Missing required fields' });
                continue;
            }

            if (q.options.length !== 4) {
                errors.push({ index: i, error: 'Must have exactly 4 options' });
                continue;
            }

            if (q.correctOption < 0 || q.correctOption > 3) {
                errors.push({ index: i, error: 'correctOption must be between 0 and 3' });
                continue;
            }

            validQuestions.push({
                category: q.category,
                questionText: q.questionText,
                options: q.options,
                correctOption: q.correctOption,
                difficulty: q.difficulty || 'medium',
                isActive: q.isActive !== undefined ? q.isActive : true
            });
        }

        if (validQuestions.length === 0) {
            return fail(res, 'No valid questions to import', 400);
        }

        const result = await Question.insertMany(validQuestions, { ordered: false });

        return ok(res, {
            imported: result.length,
            total: questions.length,
            errors: errors.length > 0 ? errors : undefined
        }, 201);
    } catch (error) {
        next(error);
    }
}

// Get question statistics
export async function getQuestionStats(req, res, next) {
    try {
        const [total, active, byCategory, byDifficulty] = await Promise.all([
            Question.countDocuments(),
            Question.countDocuments({ isActive: true }),
            Question.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Question.aggregate([
                { $group: { _id: '$difficulty', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        return ok(res, {
            total,
            active,
            inactive: total - active,
            byCategory,
            byDifficulty
        });
    } catch (error) {
        next(error);
    }
}