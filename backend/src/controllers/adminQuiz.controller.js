import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { ok, fail } from '../utils/apiResponse.js';

function buildQuizCard(quiz, questions) {
  const quizQuestions = questions.filter(
    (question) => question.quizId?.toString() === quiz._id.toString()
  );
  const activeQuestions = quizQuestions.filter((question) => question.isActive);

  return {
    _id: quiz._id,
    name: quiz.name,
    description: quiz.description,
    isActive: quiz.isActive,
    totalQuestions: quizQuestions.length,
    activeQuestions: activeQuestions.length,
    inactiveQuestions: quizQuestions.length - activeQuestions.length,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt
  };
}

export async function getAdminDashboard(req, res, next) {
  try {
    const [quizzes, questions, users] = await Promise.all([
      Quiz.find().sort({ createdAt: -1 }),
      Question.find(),
      User.find()
    ]);

    return ok(res, {
      stats: {
        totalQuizzes: quizzes.length,
        activeQuizzes: quizzes.filter((quiz) => quiz.isActive).length,
        inactiveQuizzes: quizzes.filter((quiz) => !quiz.isActive).length,
        totalUsers: users.length,
        admins: users.filter((user) => user.role === 'admin').length,
        normalUsers: users.filter((user) => user.role === 'user').length
      },
      quizzes: quizzes.map((quiz) => buildQuizCard(quiz, questions))
    });
  } catch (error) {
    next(error);
  }
}

export async function listQuizzes(req, res, next) {
  try {
    const [quizzes, questions] = await Promise.all([
      Quiz.find().sort({ createdAt: -1 }),
      Question.find()
    ]);

    return ok(res, {
      quizzes: quizzes.map((quiz) => buildQuizCard(quiz, questions))
    });
  } catch (error) {
    next(error);
  }
}

export async function createQuiz(req, res, next) {
  try {
    const { name, description = '', isActive = false } = req.body;

    if (!name || name.trim().length < 3) {
      return fail(res, 'Quiz name must be at least 3 characters', 400);
    }

    const existing = await Quiz.findOne({ name: name.trim() });
    if (existing) return fail(res, 'Quiz name already exists', 409);

    const quiz = await Quiz.create({
      name: name.trim(),
      description: description.trim(),
      isActive: isActive === true
    });

    return ok(res, { quiz }, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const { name, description = '', isActive = false } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) return fail(res, 'Quiz not found', 404);
    if (!name || name.trim().length < 3) {
      return fail(res, 'Quiz name must be at least 3 characters', 400);
    }

    const existing = await Quiz.findOne({ name: name.trim(), _id: { $ne: quiz._id } });
    if (existing) return fail(res, 'Quiz name already exists', 409);

    quiz.name = name.trim();
    quiz.description = description.trim();
    quiz.isActive = isActive === true;

    await quiz.save();
    return ok(res, { quiz });
  } catch (error) {
    next(error);
  }
}

export async function toggleQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return fail(res, 'Quiz not found', 404);

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    return ok(res, { quiz });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return fail(res, 'Quiz not found', 404);

    await Question.deleteMany({ quizId: quiz._id });
    return ok(res, { message: 'Quiz and related questions deleted' });
  } catch (error) {
    next(error);
  }
}
