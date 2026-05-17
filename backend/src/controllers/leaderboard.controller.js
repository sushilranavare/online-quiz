import { Score } from '../models/Score.js';
import { ok } from '../utils/apiResponse.js';

// Leaderboard for Timed Questions variation.
// Uses saved score attempts from Score collection.
// Higher score comes first. If scores are equal, newer attempts appear first.
export async function getLeaderboard(req, res) {
  const leaderboard = await Score.find()
    .sort({ score: -1, createdAt: -1 })
    .limit(20)
    .select('username correctAnswers totalQuestions timeBonus score createdAt');

  return ok(res, {
    leaderboard
  });
}
