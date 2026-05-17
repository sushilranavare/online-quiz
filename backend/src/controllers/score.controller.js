import mongoose from 'mongoose';
import Score from '../models/Score.js';
import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import { ok, fail } from '../utils/apiResponse.js';

const QUESTION_TIME_SECONDS = 30;
const MAX_TIME_BONUS = 1;

export async function submitScore(req, res, next) {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length < 6 || answers.length > 10) {
      return fail(res, 'Quiz submission must contain 6 to 10 answers', 400);
    }

    const invalidAnswer = answers.find((answer) => !mongoose.Types.ObjectId.isValid(answer.questionId));
    if (invalidAnswer) return fail(res, 'Invalid question ID submitted', 400);

    const questionIds = answers.map((answer) => answer.questionId);
    const questions = await Question.find({ _id: { $in: questionIds }, isActive: true });

    if (questions.length !== answers.length) {
      return fail(res, 'One or more submitted questions are invalid', 400);
    }

    const quiz = questions[0]?.quizId ? await Quiz.findById(questions[0].quizId) : null;
    const user = await User.findById(req.user.id);

    let correctAnswers = 0;

    const finalAnswers = answers.map((answer) => {
      const question = questions.find((item) => item._id.toString() === answer.questionId);
      const isCorrect = question.correctAnswer === answer.selectedAnswer;

      if (isCorrect) correctAnswers += 1;

      return {
        questionId: question._id,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        remainingTimeSeconds: Number(answer.remainingTimeSeconds || 0)
      };
    });

    const totalRemainingTimeSeconds = finalAnswers.reduce(
      (sum, answer) => sum + answer.remainingTimeSeconds,
      0
    );
    const totalAllowedTimeSeconds = answers.length * QUESTION_TIME_SECONDS;
    const timeBonus = Number(Math.min(MAX_TIME_BONUS, totalRemainingTimeSeconds / totalAllowedTimeSeconds).toFixed(2));
    const finalScore = Number((correctAnswers + timeBonus).toFixed(2));

    const attempt = await Score.create({
      user: req.user.id,
      username: user?.username || 'Unknown User',
      quizId: quiz?._id,
      quizName: quiz?.name || 'Timed Quiz',
      correctAnswers,
      totalQuestions: answers.length,
      timeBonus,
      score: finalScore,
      questionTimeSeconds: QUESTION_TIME_SECONDS,
      totalRemainingTimeSeconds,
      answers: finalAnswers
    });

    return ok(res, { attempt }, 201);
  } catch (error) {
    next(error);
  }
}

export async function getUserScores(req, res, next) {
  try {
    const attempts = await Score.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('answers.questionId', 'questionText')
      .lean();

    return ok(res, { attempts });
  } catch (error) {
    next(error);
  }
}

export async function getScoreById(req, res, next) {
  try {
    const attempt = await Score.findOne({ _id: req.params.id, user: req.user.id })
      .populate('answers.questionId', 'questionText')
      .lean();

    if (!attempt) return fail(res, 'Score not found', 404);
    return ok(res, { attempt });
  } catch (error) {
    next(error);
  }
}
