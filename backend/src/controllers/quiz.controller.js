import Question from '../models/Question.js';
import { ok, fail } from '../utils/apiResponse.js';

const categories = ['Geography', 'Science', 'History', 'Sports', 'Entertainment', 'Technology'];

export async function getCategories(req, res, next) {
    try {
        return ok(res, { categories });
    } catch (error) {
        next(error);
    }
}

export async function getQuestionsByCategory(req, res, next) {
    try {
        const { category } = req.params;

        if (!categories.includes(category)) {
            return fail(res, 'Invalid category', 400);
        }

        const questions = await Question.find({ category, isActive: true })
            .select('_id category questionText options difficulty')
            .lean();

        // Shuffle questions
        const shuffled = questions.sort(() => Math.random() - 0.5);

        return ok(res, { questions: shuffled });
    } catch (error) {
        next(error);
    }
}

function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}