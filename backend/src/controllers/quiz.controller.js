import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import { ok, fail } from '../utils/apiResponse.js';
import { shuffleArray } from '../utils/shuffle.js';

const MIN_QUESTIONS_REQUIRED = 6;
const MAX_QUESTION_BANK_SIZE = 15;
const MAX_QUESTIONS_PER_QUIZ = 10;
const QUESTION_TIME_SECONDS = 30;

async function getQuizQuestionCounts(quizId) {
  const totalQuestions = await Question.countDocuments({ quizId });
  const activeQuestions = await Question.countDocuments({ quizId, isActive: true });

  return {
    totalQuestions,
    activeQuestions,
    inactiveQuestions: totalQuestions - activeQuestions,
    isPlayable: activeQuestions >= MIN_QUESTIONS_REQUIRED && activeQuestions <= MAX_QUESTION_BANK_SIZE
  };
}

function prepareQuizQuestions(questions) {
  const selectedQuestions = shuffleArray(questions).slice(0, Math.min(questions.length, MAX_QUESTIONS_PER_QUIZ));

  return selectedQuestions.map((question) => ({
    _id: question._id,
    quizId: question.quizId,
    questionText: question.questionText,
    options: shuffleArray(question.options)
  }));
}

async function buildQuizResponse(res, quiz) {
  const activeQuestions = await Question.find({ quizId: quiz._id, isActive: true }).select('-correctAnswer');

  if (activeQuestions.length < MIN_QUESTIONS_REQUIRED) {
    return fail(res, `This quiz needs at least ${MIN_QUESTIONS_REQUIRED} active questions before users can attempt it.`, 400);
  }

  if (activeQuestions.length > MAX_QUESTION_BANK_SIZE) {
    return fail(res, `This quiz has too many active questions. Maximum ${MAX_QUESTION_BANK_SIZE} active questions are allowed.`, 400);
  }

  const preparedQuestions = prepareQuizQuestions(activeQuestions);

  return ok(res, {
    quiz: {
      _id: quiz._id,
      name: quiz.name,
      description: quiz.description
    },
    totalQuestions: preparedQuestions.length,
    minQuestionsRequired: MIN_QUESTIONS_REQUIRED,
    maxQuestionBankSize: MAX_QUESTION_BANK_SIZE,
    questionTimeSeconds: QUESTION_TIME_SECONDS,
    questions: preparedQuestions
  });
}

export async function getAvailableQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find({ isActive: true }).sort({ updatedAt: -1, createdAt: -1 });

    const quizCards = await Promise.all(
      quizzes.map(async (quiz) => ({
        _id: quiz._id,
        name: quiz.name,
        description: quiz.description,
        isActive: quiz.isActive,
        ...(await getQuizQuestionCounts(quiz._id))
      }))
    );

    return ok(res, {
      minQuestionsRequired: MIN_QUESTIONS_REQUIRED,
      maxQuestionBankSize: MAX_QUESTION_BANK_SIZE,
      quizzes: quizCards
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuizQuestionsByQuiz(req, res, next) {
  try {
    const { quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) return fail(res, 'Invalid quiz ID', 400);

    const quiz = await Quiz.findOne({ _id: quizId, isActive: true });
    if (!quiz) return fail(res, 'Quiz not found or not active', 404);

    return buildQuizResponse(res, quiz);
  } catch (error) {
    next(error);
  }
}

export async function getQuizQuestions(req, res, next) {
  try {
    const quizzes = await Quiz.find({ isActive: true }).sort({ updatedAt: -1, createdAt: -1 });

    for (const quiz of quizzes) {
      const counts = await getQuizQuestionCounts(quiz._id);
      if (counts.isPlayable) return buildQuizResponse(res, quiz);
    }

    return fail(res, `No playable quiz found. Admin must activate a quiz with ${MIN_QUESTIONS_REQUIRED}-${MAX_QUESTION_BANK_SIZE} active questions.`, 400);
  } catch (error) {
    next(error);
  }
}

export async function getQuizzes(req, res) {
  return ok(res, { quizzesOnly: true });
}
