import mongoose from 'mongoose';
import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';
import { ok, fail } from '../utils/apiResponse.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function listQuestions(req, res, next) {
  try {
    const { quizId } = req.query;

    if (!quizId || !isValidId(quizId)) {
      return fail(res, 'Valid quizId query parameter is required', 400);
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return fail(res, 'Quiz not found', 404);

    const questions = await Question.find({ quizId }).sort({ createdAt: -1 });

    return ok(res, {
      quiz,
      questions,
      stats: {
        total: questions.length,
        active: questions.filter((question) => question.isActive).length,
        inactive: questions.filter((question) => !question.isActive).length
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const { quizId, questionText, options, correctAnswer, isActive = false } = req.body;

    if (!isValidId(quizId)) return fail(res, 'Invalid quizId', 400);
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return fail(res, 'Quiz not found', 404);

    if (!options.includes(correctAnswer)) {
      return fail(res, 'Correct answer must match one of the options', 400);
    }

    const question = await Question.create({
      quizId,
      questionText,
      options,
      correctAnswer,
      isActive: isActive === true
    });

    return ok(res, { question }, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const { quizId, questionText, options, correctAnswer, isActive = false } = req.body;

    if (!isValidId(req.params.id)) return fail(res, 'Invalid question ID', 400);
    if (!isValidId(quizId)) return fail(res, 'Invalid quizId', 400);

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return fail(res, 'Quiz not found', 404);

    if (!options.includes(correctAnswer)) {
      return fail(res, 'Correct answer must match one of the options', 400);
    }

    const question = await Question.findById(req.params.id);
    if (!question) return fail(res, 'Question not found', 404);

    question.quizId = quizId;
    question.questionText = questionText;
    question.options = options;
    question.correctAnswer = correctAnswer;
    question.isActive = isActive === true;

    await question.save();
    return ok(res, { question });
  } catch (error) {
    next(error);
  }
}

export async function toggleQuestion(req, res, next) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return fail(res, 'Question not found', 404);

    question.isActive = !question.isActive;
    await question.save();

    return ok(res, { question });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return fail(res, 'Question not found', 404);

    return ok(res, { message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
}

export async function importQuestions(req, res, next) {
  try {
    const { quizId, questions } = req.body;

    if (!isValidId(quizId)) return fail(res, 'Invalid quizId', 400);
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return fail(res, 'Quiz not found', 404);

    for (const question of questions) {
      if (!question.options.includes(question.correctAnswer)) {
        return fail(res, `Correct answer must match one option for question: ${question.questionText}`, 400);
      }
    }

    const imported = await Question.insertMany(
      questions.map((question) => ({
        quizId,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        isActive: question.isActive === true
      }))
    );

    return ok(res, { imported: imported.length, questions: imported }, 201);
  } catch (error) {
    next(error);
  }
}
