import Score from '../models/Score.js';
import { ok, fail } from '../utils/apiResponse.js';

// Get global leaderboard
export async function getGlobalLeaderboard(req, res, next) {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get top scores aggregated by user
        const leaderboard = await Score.aggregate([
            {
                $group: {
                    _id: '$user',
                    username: { $first: '$username' },
                    totalScore: { $sum: '$score' },
                    totalQuestions: { $sum: '$totalQuestions' },
                    attempts: { $sum: 1 },
                    bestScore: { $max: '$score' }
                }
            },
            { $sort: { totalScore: -1, bestScore: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    username: 1,
                    totalScore: 1,
                    totalQuestions: 1,
                    attempts: 1,
                    bestScore: 1,
                    averageScore: { $round: [{ $divide: ['$totalScore', '$attempts'] }, 1] }
                }
            }
        ]);

        // Get total unique users
        const totalUsers = await Score.distinct('user').then(users => users.length);

        // Add rank to each entry
        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: skip + index + 1
        }));

        return ok(res, {
            leaderboard: rankedLeaderboard,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers
            }
        });
    } catch (error) {
        next(error);
    }
}

// Get leaderboard by category
export async function getCategoryLeaderboard(req, res, next) {
    try {
        const { category } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (!category) {
            return fail(res, 'Category is required', 400);
        }

        const leaderboard = await Score.aggregate([
            { $match: { category } },
            {
                $group: {
                    _id: '$user',
                    username: { $first: '$username' },
                    totalScore: { $sum: '$score' },
                    totalQuestions: { $sum: '$totalQuestions' },
                    attempts: { $sum: 1 },
                    bestScore: { $max: '$score' }
                }
            },
            { $sort: { totalScore: -1, bestScore: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    username: 1,
                    totalScore: 1,
                    totalQuestions: 1,
                    attempts: 1,
                    bestScore: 1,
                    averageScore: { $round: [{ $divide: ['$totalScore', '$attempts'] }, 1] }
                }
            }
        ]);

        const totalUsers = await Score.distinct('user', { category }).then(users => users.length);

        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: skip + index + 1
        }));

        return ok(res, {
            leaderboard: rankedLeaderboard,
            category,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers
            }
        });
    } catch (error) {
        next(error);
    }
}

// Get user's rank
export async function getUserRank(req, res, next) {
    try {
        const { userId } = req.params;

        // Get user's best score
        const userScore = await Score.findOne({ user: userId })
            .sort({ score: -1 })
            .select('score username');

        if (!userScore) {
            return fail(res, 'User has no scores yet', 404);
        }

        // Count users with higher scores
        const rank = await Score.countDocuments({
            score: { $gt: userScore.score }
        }) + 1;

        return ok(res, {
            userId,
            username: userScore.username,
            bestScore: userScore.score,
            rank,
            percentile: 100 - Math.round((rank / 100) * 100)
        });
    } catch (error) {
        next(error);
    }
}

// Get available categories for leaderboard
export async function getCategories(req, res, next) {
    try {
        const categories = await Score.distinct('category');

        return ok(res, { categories });
    } catch (error) {
        next(error);
    }
}