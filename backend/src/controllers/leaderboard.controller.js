import Score from '../models/Score.js';
import { ok } from '../utils/apiResponse.js';

export async function getLeaderboard(req, res, next) {
  try {
    const leaderboard = await Score.find()
      .sort({ score: -1, createdAt: -1 })
      .limit(20)
      .select('username quizName correctAnswers totalQuestions timeBonus score createdAt')
      .lean();

    return ok(res, { leaderboard });
  } catch (error) {
    next(error);
  }
}
