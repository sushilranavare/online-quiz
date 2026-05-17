import Score from '../models/Score.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function submitScore(req, res, next) {
    try {
        const { score, totalQuestions, category, answers, timeSpent } = req.body;
        const userId = req.user.id;

        // Get username from User model (if available)
        const username = req.user.username || 'Anonymous';

        const newScore = await Score.create({
            user: userId,
            username,
            score,
            totalQuestions,
            category,
            answers: answers || [],
            timeSpent: timeSpent || 0
        });

        return ok(res, newScore, 201);
    } catch (error) {
        next(error);
    }
}

export async function getUserScores(req, res, next) {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [attempts, total] = await Promise.all([
            Score.find({ user: userId })
                .sort({ completedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Score.countDocuments({ user: userId })
        ]);

        return ok(res, {
            attempts,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function getScoreById(req, res, next) {
    try {
        const score = await Score.findById(req.params.id).lean();

        if (!score) {
            return fail(res, 'Score not found', 404);
        }

        return ok(res, score);
    } catch (error) {
        next(error);
    }
}