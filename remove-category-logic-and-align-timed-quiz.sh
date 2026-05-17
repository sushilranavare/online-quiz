#!/usr/bin/env bash
set -e

# Removes category-based quiz logic and aligns project with Timed Questions + Quiz Management.
# Run from project root.

mkdir -p backend/src/models backend/src/controllers backend/src/routes backend/src/validations backend/src/utils
mkdir -p frontend/src/api frontend/src/components/admin frontend/src/components/attempts frontend/src/components/common frontend/src/components/leaderboard frontend/src/components/quiz frontend/src/context frontend/src/hooks frontend/src/pages/admin frontend/src/pages frontend/src/reducers frontend/src/routes frontend/src/schemas frontend/src/utils

cat > backend/src/models/Quiz.js <<'EOF'
import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Quiz name is required'],
      trim: true,
      unique: true,
      minlength: [3, 'Quiz name must be at least 3 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export { Quiz };
export default Quiz;
EOF

cat > backend/src/models/Question.js <<'EOF'
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz is required']
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 4 && value.every(Boolean);
        },
        message: 'Each question must have exactly 4 non-empty options'
      }
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required']
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

questionSchema.pre('validate', function validateCorrectAnswer(next) {
  if (this.options && !this.options.includes(this.correctAnswer)) {
    return next(new Error('Correct answer must match one of the options'));
  }

  return next();
});

const Question = mongoose.model('Question', questionSchema);
export { Question };
export default Question;
EOF

cat > backend/src/models/Score.js <<'EOF'
import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    remainingTimeSeconds: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    quizName: {
      type: String,
      default: 'Timed Quiz'
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 6,
      max: 10
    },
    timeBonus: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    questionTimeSeconds: {
      type: Number,
      default: 30
    },
    totalRemainingTimeSeconds: {
      type: Number,
      default: 0
    },
    answers: {
      type: [answerSchema],
      required: true
    }
  },
  { timestamps: true }
);

scoreSchema.index({ user: 1, createdAt: -1 });
scoreSchema.index({ score: -1, createdAt: -1 });
scoreSchema.index({ quizId: 1, score: -1 });

const Score = mongoose.model('Score', scoreSchema);
export { Score };
export default Score;
EOF

cat > backend/src/utils/shuffle.js <<'EOF'
export function shuffleArray(array = []) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

export default shuffleArray;
EOF

cat > backend/src/validations/question.validation.js <<'EOF'
export function validateQuestion(req, res, next) {
  const { quizId, questionText, options, correctAnswer } = req.body;
  const errors = [];

  if (!quizId) errors.push('Quiz is required');
  if (!questionText || questionText.trim().length < 5) {
    errors.push('Question text must be at least 5 characters');
  }
  if (!Array.isArray(options) || options.length !== 4 || options.some((option) => !option.trim())) {
    errors.push('Exactly 4 non-empty options are required');
  }
  if (!correctAnswer || !options?.includes(correctAnswer)) {
    errors.push('Correct answer must match one of the options');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, error: errors.join(', ') });
  }

  req.body.questionText = questionText.trim();
  req.body.options = options.map((option) => option.trim());
  req.body.correctAnswer = correctAnswer.trim();
  req.body.isActive = req.body.isActive === true;

  return next();
}

export function validateBulkQuestions(req, res, next) {
  const { quizId, questions } = req.body;

  if (!quizId) {
    return res.status(400).json({ success: false, error: 'Quiz is required' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, error: 'Questions array is required' });
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];

    if (!question.questionText || !Array.isArray(question.options) || question.options.length !== 4) {
      return res.status(400).json({ success: false, error: `Invalid question at index ${index}` });
    }

    if (!question.options.includes(question.correctAnswer)) {
      return res.status(400).json({ success: false, error: `Correct answer must match one option at index ${index}` });
    }
  }

  return next();
}
EOF

cat > backend/src/validations/score.validation.js <<'EOF'
export function validateScoreSubmission(req, res, next) {
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ success: false, error: 'Answers array is required' });
  }

  if (answers.length < 6 || answers.length > 10) {
    return res.status(400).json({ success: false, error: 'Quiz submission must contain 6 to 10 answers' });
  }

  for (const answer of answers) {
    if (!answer.questionId || !answer.selectedAnswer) {
      return res.status(400).json({ success: false, error: 'Each answer needs questionId and selectedAnswer' });
    }
  }

  return next();
}
EOF

cat > backend/src/controllers/adminQuiz.controller.js <<'EOF'
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
EOF

cat > backend/src/controllers/adminQuestion.controller.js <<'EOF'
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
EOF

cat > backend/src/controllers/quiz.controller.js <<'EOF'
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

export async function getCategories(req, res) {
  return ok(res, { quizzesOnly: true });
}
EOF

cat > backend/src/controllers/score.controller.js <<'EOF'
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
EOF

cat > backend/src/controllers/leaderboard.controller.js <<'EOF'
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
EOF

cat > backend/src/routes/adminQuiz.routes.js <<'EOF'
import express from 'express';
import {
  createQuiz,
  deleteQuiz,
  getAdminDashboard,
  listQuizzes,
  toggleQuiz,
  updateQuiz
} from '../controllers/adminQuiz.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', getAdminDashboard);
router.get('/', listQuizzes);
router.post('/', createQuiz);
router.put('/:id', updateQuiz);
router.patch('/:id/toggle', toggleQuiz);
router.delete('/:id', deleteQuiz);

export default router;
EOF

cat > backend/src/routes/adminQuestion.routes.js <<'EOF'
import express from 'express';
import {
  createQuestion,
  deleteQuestion,
  importQuestions,
  listQuestions,
  toggleQuestion,
  updateQuestion
} from '../controllers/adminQuestion.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';
import { validateBulkQuestions, validateQuestion } from '../validations/question.validation.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', listQuestions);
router.post('/', validateQuestion, createQuestion);
router.post('/import', validateBulkQuestions, importQuestions);
router.put('/:id', validateQuestion, updateQuestion);
router.patch('/:id/toggle', toggleQuestion);
router.delete('/:id', deleteQuestion);

export default router;
EOF

cat > backend/src/routes/quiz.routes.js <<'EOF'
import express from 'express';
import {
  getAvailableQuizzes,
  getCategories,
  getQuizQuestions,
  getQuizQuestionsByQuiz
} from '../controllers/quiz.controller.js';

const router = express.Router();

router.get('/available', getAvailableQuizzes);
router.get('/categories', getCategories);
router.get('/', getQuizQuestions);
router.get('/:quizId', getQuizQuestionsByQuiz);

export default router;
EOF

cat > backend/src/routes/score.routes.js <<'EOF'
import express from 'express';
import { getScoreById, getUserScores, submitScore } from '../controllers/score.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateScoreSubmission } from '../validations/score.validation.js';

const router = express.Router();

router.post('/', authMiddleware, validateScoreSubmission, submitScore);
router.get('/', authMiddleware, getUserScores);
router.get('/me', authMiddleware, getUserScores);
router.get('/:id', authMiddleware, getScoreById);

export default router;
EOF

cat > backend/src/routes/leaderboard.routes.js <<'EOF'
import express from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';

const router = express.Router();

router.get('/', getLeaderboard);

export default router;
EOF

python3 - <<'PY'
from pathlib import Path
path = Path('backend/src/app.js')
text = path.read_text()
if "adminQuizRoutes" not in text:
    text = text.replace("import adminQuestionRoutes from './routes/adminQuestion.routes.js';", "import adminQuestionRoutes from './routes/adminQuestion.routes.js';\nimport adminQuizRoutes from './routes/adminQuiz.routes.js';")
if "app.use('/api/admin/quizzes'" not in text:
    text = text.replace("app.use('/api/admin/questions', adminQuestionRoutes);", "app.use('/api/admin/questions', adminQuestionRoutes);\napp.use('/api/admin/quizzes', adminQuizRoutes);")
path.write_text(text)
PY

cat > frontend/src/api/quizApi.js <<'EOF'
import api from './axios';

export const quizApi = {
  getAvailableQuizzes: () => api.get('/quiz/available'),
  getQuestions: (quizId = '') => (quizId ? api.get(`/quiz/${quizId}`) : api.get('/quiz'))
};

export default quizApi;
EOF

cat > frontend/src/api/scoreApi.js <<'EOF'
import api from './axios';

export const scoreApi = {
  submitScore: (data) => api.post('/scores', data),
  getUserAttempts: () => api.get('/scores/me'),
  getMyAttempts: () => api.get('/scores/me'),
  getAttempt: (id) => api.get(`/scores/${id}`)
};

export default scoreApi;
EOF

cat > frontend/src/api/leaderboardApi.js <<'EOF'
import api from './axios';

export const leaderboardApi = {
  getLeaderboard: () => api.get('/leaderboard')
};

export default leaderboardApi;
EOF

cat > frontend/src/api/adminApi.js <<'EOF'
import api from './axios';

export const adminApi = {
  getDashboard: () => api.get('/admin/quizzes/dashboard'),
  getQuizzes: () => api.get('/admin/quizzes'),
  createQuiz: (data) => api.post('/admin/quizzes', data),
  updateQuiz: (id, data) => api.put(`/admin/quizzes/${id}`, data),
  toggleQuiz: (id) => api.patch(`/admin/quizzes/${id}/toggle`),
  deleteQuiz: (id) => api.delete(`/admin/quizzes/${id}`),
  getQuestions: (quizId) => api.get('/admin/questions', { params: { quizId } }),
  createQuestion: (data) => api.post('/admin/questions', data),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  toggleQuestionStatus: (id) => api.patch(`/admin/questions/${id}/toggle`),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),
  importQuestions: (quizId, questions) => api.post('/admin/questions/import', { quizId, questions })
};

export default adminApi;
EOF

cat > frontend/src/context/QuizContext.jsx <<'EOF'
import { createContext, useContext, useReducer } from 'react';

export const QuizContext = createContext(null);

export const quizInitialState = {
  questions: [],
  currentIndex: 0,
  answers: [],
  result: null,
  isStarted: false,
  questionTimeSeconds: 30
};

export function quizReducer(state, action) {
  switch (action.type) {
    case 'START_QUIZ':
      return {
        questions: action.payload.questions,
        currentIndex: 0,
        answers: [],
        result: null,
        isStarted: true,
        questionTimeSeconds: action.payload.questionTimeSeconds || 30
      };
    case 'SAVE_ANSWER': {
      const existingAnswerIndex = state.answers.findIndex(
        (answer) => answer.questionId === action.payload.questionId
      );
      const updatedAnswers = [...state.answers];

      if (existingAnswerIndex >= 0) updatedAnswers[existingAnswerIndex] = action.payload;
      else updatedAnswers.push(action.payload);

      return { ...state, answers: updatedAnswers };
    }
    case 'NEXT_QUESTION':
      return { ...state, currentIndex: state.currentIndex + 1 };
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    case 'RESET_QUIZ':
      return quizInitialState;
    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, quizInitialState);

  return (
    <QuizContext.Provider value={{ state, dispatch, quizState: state, quizDispatch: dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within QuizProvider');
  return context;
}

export default QuizProvider;
EOF

cat > frontend/src/hooks/useQuiz.js <<'EOF'
import { useQuiz as useQuizContext } from '../context/QuizContext';

export function useQuiz() {
  return useQuizContext();
}

export default useQuiz;
EOF

cat > frontend/src/App.jsx <<'EOF'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/common/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import AttemptsPage from './pages/AttemptsPage';
import LeaderboardPage from './pages/LeaderboardPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminQuizzesPage from './pages/admin/AdminQuizzesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/attempts" element={<ProtectedRoute><AttemptsPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />

          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/quizzes" element={<AdminRoute><AdminQuizzesPage /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
EOF

cat > frontend/src/components/common/Navbar.jsx <<'EOF'
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo">Quiz Game</Link>
        </div>

        <div className="nav-links">
          {isAuthenticated && (
            <>
              {!isAdmin && <Link to="/quiz" className="nav-link">Take Quiz</Link>}
              {!isAdmin && <Link to="/attempts" className="nav-link">My Attempts</Link>}
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" className="nav-link admin-link">Dashboard</Link>
                  <Link to="/admin/quizzes" className="nav-link admin-link">Quizzes</Link>
                </>
              )}
            </>
          )}
        </div>

        <div className="nav-actions">
          <DarkModeToggle />
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user?.username}</span>
              <button onClick={handleLogout} className="nav-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link nav-btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
EOF

cat > frontend/src/pages/HomePage.jsx <<'EOF'
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="home-page">
      <section className="hero-section card">
        <h1>Online Timed Quiz Game</h1>
        <p>
          Attempt active quizzes with a timer for each question, track your
          attempts, and compare scores on the leaderboard.
        </p>

        {isAuthenticated ? (
          isAdmin ? (
            <Link to="/admin/dashboard" className="btn btn-primary">Open Admin Dashboard</Link>
          ) : (
            <Link to="/quiz" className="btn btn-primary">Choose a Quiz</Link>
          )
        ) : (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        )}
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <h3>Timed Questions</h3>
          <p>Each question has its own countdown timer.</p>
        </div>
        <div className="feature-card">
          <h3>Quiz Selection</h3>
          <p>Choose from active quizzes created by admin users.</p>
        </div>
        <div className="feature-card">
          <h3>Leaderboard</h3>
          <p>Scores include correct answers plus a small time bonus.</p>
        </div>
      </section>
    </div>
  );
}
EOF

cat > frontend/src/pages/QuizPage.jsx <<'EOF'
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../api/quizApi';
import { scoreApi } from '../api/scoreApi';
import { useQuiz } from '../hooks/useQuiz';
import QuestionCard from '../components/quiz/QuestionCard';
import QuizProgress from '../components/quiz/QuizProgress';

const NO_ANSWER = 'No Answer';

export default function QuizPage() {
  const navigate = useNavigate();
  const { quizState, quizDispatch } = useQuiz();

  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const isSubmittingRef = useRef(false);
  const currentQuestion = quizState.questions[quizState.currentIndex];
  const questionTimeSeconds = quizState.questionTimeSeconds || 30;

  const loadAvailableQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await quizApi.getAvailableQuizzes();
      setAvailableQuizzes(response.data.data.quizzes || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!quizState.isStarted) loadAvailableQuizzes();
  }, [loadAvailableQuizzes, quizState.isStarted]);

  const buildCompletedAnswers = useCallback(
    (latestAnswer = null) => {
      const answerMap = new Map();

      quizState.answers.forEach((answer) => {
        answerMap.set(answer.questionId, {
          selectedAnswer: answer.selectedAnswer,
          remainingTimeSeconds: answer.remainingTimeSeconds
        });
      });

      if (latestAnswer) {
        answerMap.set(latestAnswer.questionId, {
          selectedAnswer: latestAnswer.selectedAnswer,
          remainingTimeSeconds: latestAnswer.remainingTimeSeconds
        });
      }

      return quizState.questions.map((question) => {
        const savedAnswer = answerMap.get(question._id);
        return {
          questionId: question._id,
          selectedAnswer: savedAnswer?.selectedAnswer || NO_ANSWER,
          remainingTimeSeconds: savedAnswer?.remainingTimeSeconds || 0
        };
      });
    },
    [quizState.answers, quizState.questions]
  );

  const submitTimedQuiz = useCallback(
    async (latestAnswer = null) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
        setLoading(true);
        setError('');

        const response = await scoreApi.submitScore({
          answers: buildCompletedAnswers(latestAnswer)
        });

        quizDispatch({ type: 'SET_RESULT', payload: response.data.data.attempt });
        navigate('/result');
      } catch (err) {
        isSubmittingRef.current = false;
        setError(err.response?.data?.error || 'Failed to submit quiz. Please login again and retry.');
      } finally {
        setLoading(false);
      }
    },
    [buildCompletedAnswers, navigate, quizDispatch]
  );

  const saveAnswerAndMove = useCallback(
    async (selectedValue, remainingSeconds) => {
      if (!currentQuestion) return;

      const currentAnswer = {
        questionId: currentQuestion._id,
        selectedAnswer: selectedValue || NO_ANSWER,
        remainingTimeSeconds: selectedValue ? remainingSeconds : 0
      };

      quizDispatch({ type: 'SAVE_ANSWER', payload: currentAnswer });

      const isLastQuestion = quizState.currentIndex === quizState.questions.length - 1;
      if (isLastQuestion) {
        await submitTimedQuiz(currentAnswer);
        return;
      }

      quizDispatch({ type: 'NEXT_QUESTION' });
      setSelectedAnswer('');
      setFeedback('');
      setTimeRemaining(questionTimeSeconds);
    },
    [currentQuestion, questionTimeSeconds, quizDispatch, quizState.currentIndex, quizState.questions.length, submitTimedQuiz]
  );

  useEffect(() => {
    if (!quizState.isStarted || quizState.result || isSubmittingRef.current) return;

    if (timeRemaining <= 0) {
      setFeedback('Time is up! Moving to the next question...');
      saveAnswerAndMove(selectedAnswer || NO_ANSWER, 0);
      return;
    }

    const timerId = setTimeout(() => setTimeRemaining((current) => current - 1), 1000);
    return () => clearTimeout(timerId);
  }, [quizState.isStarted, quizState.result, saveAnswerAndMove, selectedAnswer, timeRemaining]);

  async function handleStartQuiz(quiz) {
    try {
      setLoading(true);
      setError('');
      setFeedback('');
      isSubmittingRef.current = false;

      const response = await quizApi.getQuestions(quiz._id);
      setSelectedQuiz(response.data.data.quiz || quiz);

      quizDispatch({
        type: 'START_QUIZ',
        payload: {
          questions: response.data.data.questions,
          questionTimeSeconds: response.data.data.questionTimeSeconds
        }
      });

      setSelectedAnswer('');
      setTimeRemaining(response.data.data.questionTimeSeconds || 30);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAnswer(answer) {
    setFeedback('');
    setSelectedAnswer(answer);
  }

  async function handleNextOrSubmit() {
    if (!currentQuestion) return;
    if (!selectedAnswer) {
      setError('Please select one answer');
      return;
    }

    setError('');
    setFeedback('');
    await saveAnswerAndMove(selectedAnswer, timeRemaining);
  }

  if (!quizState.isStarted) {
    return (
      <section className="card">
        <h2>Available Quizzes</h2>
        <p>Choose one active quiz to start. A quiz is playable only when it has 6 to 15 active questions.</p>

        {error && <p className="error-message">{error}</p>}
        {loading && <p>Loading quizzes...</p>}

        <div className="quiz-card-grid">
          {availableQuizzes.map((quiz) => (
            <article key={quiz._id} className="quiz-admin-card">
              <div className="quiz-card-title-row">
                <h3>{quiz.name}</h3>
                <span className={quiz.isPlayable ? 'badge active' : 'badge inactive'}>
                  {quiz.isPlayable ? 'Ready' : 'Not Ready'}
                </span>
              </div>

              <p>{quiz.description || 'No description added.'}</p>

              <div className="quiz-card-stats">
                <span>Questions: {quiz.activeQuestions}</span>
                <span>Time: 30 seconds per question</span>
              </div>

              {!quiz.isPlayable && <p className="error-message">This quiz is not ready yet.</p>}

              <button type="button" onClick={() => handleStartQuiz(quiz)} disabled={!quiz.isPlayable || loading}>
                Start Quiz
              </button>
            </article>
          ))}

          {!availableQuizzes.length && !loading && (
            <div className="empty-state">No active quizzes are available yet.</div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      {selectedQuiz && (
        <div className="card">
          <h2>{selectedQuiz.name}</h2>
          {selectedQuiz.description && <p>{selectedQuiz.description}</p>}
        </div>
      )}

      <QuizProgress
        currentIndex={quizState.currentIndex}
        totalQuestions={quizState.questions.length}
        timeRemaining={timeRemaining}
        questionTimeSeconds={questionTimeSeconds}
      />

      {feedback && <p className="quiz-feedback">{feedback}</p>}
      {currentQuestion && <QuestionCard question={currentQuestion} selectedAnswer={selectedAnswer} onSelectAnswer={handleSelectAnswer} />}
      {error && <p className="error-message">{error}</p>}

      <button onClick={handleNextOrSubmit} disabled={loading}>
        {quizState.currentIndex === quizState.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
      </button>
    </section>
  );
}
EOF

cat > frontend/src/pages/ResultPage.jsx <<'EOF'
import { Link } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import QuizResult from '../components/quiz/QuizResult';

export default function ResultPage() {
  const { quizState, quizDispatch } = useQuiz();

  if (!quizState.result) {
    return (
      <section className="card">
        <h2>No result available</h2>
        <p>Please complete a quiz first.</p>
        <Link to="/quiz">Go to Quiz</Link>
      </section>
    );
  }

  function handleReset() {
    quizDispatch({ type: 'RESET_QUIZ' });
  }

  return (
    <section>
      <QuizResult result={quizState.result} />
      <div className="result-actions">
        <Link to="/attempts">View My Attempts</Link>
        <Link to="/leaderboard">View Leaderboard</Link>
        <Link to="/quiz" onClick={handleReset}>Try Another Quiz</Link>
      </div>
    </section>
  );
}
EOF

cat > frontend/src/components/quiz/QuizResult.jsx <<'EOF'
export default function QuizResult({ result }) {
  const timeBonus = result.timeBonus ?? 0;
  const correctAnswers = result.correctAnswers ?? 0;
  const totalQuestions = result.totalQuestions ?? 0;
  const finalScore = result.score ?? correctAnswers;

  return (
    <div className="card quiz-result-card">
      <h2>Quiz Completed</h2>

      <div className="result-summary">
        <div className="result-row"><span>Quiz</span><strong>{result.quizName || 'Timed Quiz'}</strong></div>
        <div className="result-row"><span>Correct answers</span><strong>{correctAnswers} / {totalQuestions}</strong></div>
        <div className="result-row"><span>Time bonus</span><strong>+{timeBonus}</strong></div>
        <div className="result-row result-final-score"><span>Final score</span><strong>{finalScore}</strong></div>
      </div>

      <p className="result-explanation">The final score is correct answers plus a small time bonus capped at +1 point.</p>
      {result.createdAt && <p>Completed at: {new Date(result.createdAt).toLocaleString()}</p>}
    </div>
  );
}
EOF

cat > frontend/src/components/quiz/QuizProgress.jsx <<'EOF'
export default function QuizProgress({ currentIndex, totalQuestions, timeRemaining, questionTimeSeconds }) {
  const isTimeLow = timeRemaining <= 5;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="quiz-progress-wrapper">
      <div className="quiz-progress">
        <div>
          <p>Question {currentIndex + 1} of {totalQuestions}</p>
          <p className={isTimeLow ? 'timer-warning' : ''}>
            Time: <strong>{timeRemaining}s / {questionTimeSeconds}s</strong>
          </p>
        </div>
        {isTimeLow && <p className="timer-warning-message">Hurry up! Time is almost over.</p>}
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
    </div>
  );
}
EOF

cat > frontend/src/components/quiz/QuestionCard.jsx <<'EOF'
import OptionList from './OptionList';

export default function QuestionCard({ question, selectedAnswer, onSelectAnswer }) {
  return (
    <div className="card question-card">
      <h3>{question.questionText}</h3>
      <OptionList options={question.options} selectedAnswer={selectedAnswer} onSelectAnswer={onSelectAnswer} />
    </div>
  );
}
EOF

cat > frontend/src/components/quiz/OptionList.jsx <<'EOF'
export default function OptionList({ options, selectedAnswer, onSelectAnswer }) {
  return (
    <div className="option-list">
      {options.map((option) => (
        <label key={option} className="option-item">
          <input
            type="radio"
            name="answer"
            value={option}
            checked={selectedAnswer === option}
            onChange={() => onSelectAnswer(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}
EOF

cat > frontend/src/pages/admin/AdminDashboardPage.jsx <<'EOF'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get('/admin/quizzes/dashboard');
        setStats(response.data.data.stats);
        setQuizzes(response.data.data.quizzes || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load admin dashboard');
      }
    }
    loadDashboard();
  }, []);

  return (
    <section className="card admin-page">
      <div className="admin-header">
        <div><h2>Admin Dashboard</h2><p>Manage quizzes, questions, and users.</p></div>
        <Link className="button-link" to="/admin/quizzes">Manage Quizzes</Link>
      </div>

      {error && <p className="error-message">{error}</p>}
      {stats && (
        <div className="dashboard-grid">
          <div className="stat-card"><strong>Total Quizzes</strong><p>{stats.totalQuizzes}</p></div>
          <div className="stat-card"><strong>Active Quizzes</strong><p>{stats.activeQuizzes}</p></div>
          <div className="stat-card"><strong>Inactive Quizzes</strong><p>{stats.inactiveQuizzes}</p></div>
          <div className="stat-card"><strong>Total Users</strong><p>{stats.totalUsers}</p></div>
        </div>
      )}

      <h3>Quiz Overview</h3>
      <div className="quiz-card-grid">
        {quizzes.map((quiz) => (
          <article key={quiz._id} className="quiz-admin-card">
            <div className="quiz-card-title-row"><h4>{quiz.name}</h4><span className={quiz.isActive ? 'badge active' : 'badge inactive'}>{quiz.isActive ? 'Active' : 'Inactive'}</span></div>
            <p>{quiz.description || 'No description added.'}</p>
            <div className="quiz-card-stats"><span>Total questions: {quiz.totalQuestions}</span><span>Active questions: {quiz.activeQuestions}</span><span>Inactive questions: {quiz.inactiveQuestions}</span></div>
            <Link className="button-link" to="/admin/quizzes">Modify Quiz</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
EOF

cat > frontend/src/pages/admin/AdminQuestionsPage.jsx <<'EOF'
import { Link } from 'react-router-dom';

export default function AdminQuestionsPage() {
  return (
    <section className="card">
      <h2>Question Management Moved</h2>
      <p>Questions are managed inside each quiz. Open Quiz Management to create a quiz and add questions inside it.</p>
      <Link className="button-link" to="/admin/quizzes">Go to Quiz Management</Link>
    </section>
  );
}
EOF

cat > frontend/src/pages/admin/AdminQuizzesPage.jsx <<'EOF'
import { useEffect, useState } from 'react';
import api from '../../api/axios';

const emptyQuizForm = { name: '', description: '', isActive: false };
const emptyQuestionForm = { questionText: '', options: ['', '', '', ''], correctAnswer: '', isActive: false };

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState(emptyQuizForm);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionStats, setQuestionStats] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadQuizzes() {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/quizzes');
      const loaded = response.data.data.quizzes || [];
      setQuizzes(loaded);
      if (selectedQuiz) setSelectedQuiz(loaded.find((quiz) => quiz._id === selectedQuiz._id) || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(quizId) {
    if (!quizId) return;
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/questions', { params: { quizId } });
      setQuestions(response.data.data.questions || []);
      setQuestionStats(response.data.data.stats || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => { if (selectedQuiz?._id) loadQuestions(selectedQuiz._id); }, [selectedQuiz?._id]);

  function handleQuizFormChange(event) {
    const { name, value, type, checked } = event.target;
    setQuizForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleQuestionFormChange(event) {
    const { name, value, type, checked } = event.target;
    setQuestionForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleOptionChange(index, value) {
    setQuestionForm((current) => {
      const options = [...current.options];
      options[index] = value;
      return { ...current, options };
    });
  }

  function resetQuizForm() { setQuizForm(emptyQuizForm); setEditingQuizId(null); }
  function resetQuestionForm() { setQuestionForm(emptyQuestionForm); setEditingQuestionId(null); }

  async function handleQuizSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true); setMessage(''); setError('');
      if (editingQuizId) {
        await api.put(`/admin/quizzes/${editingQuizId}`, quizForm);
        setMessage('Quiz updated successfully');
      } else {
        await api.post('/admin/quizzes', quizForm);
        setMessage('Quiz created successfully');
      }
      resetQuizForm();
      await loadQuizzes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save quiz');
    } finally { setLoading(false); }
  }

  function handleEditQuiz(quiz) {
    setEditingQuizId(quiz._id);
    setQuizForm({ name: quiz.name || '', description: quiz.description || '', isActive: quiz.isActive === true });
  }

  async function handleToggleQuiz(quizId) {
    try {
      setLoading(true); setMessage(''); setError('');
      await api.patch(`/admin/quizzes/${quizId}/toggle`);
      setMessage('Quiz status updated');
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to update quiz'); }
    finally { setLoading(false); }
  }

  async function handleDeleteQuiz(quizId) {
    if (!window.confirm('Delete this quiz and all questions inside it?')) return;
    try {
      setLoading(true); setMessage(''); setError('');
      await api.delete(`/admin/quizzes/${quizId}`);
      setSelectedQuiz(null); setQuestions([]); setQuestionStats(null);
      setMessage('Quiz deleted successfully');
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to delete quiz'); }
    finally { setLoading(false); }
  }

  async function handleQuestionSubmit(event) {
    event.preventDefault();
    if (!selectedQuiz) { setError('Please select a quiz first'); return; }
    try {
      setLoading(true); setMessage(''); setError('');
      const payload = { ...questionForm, quizId: selectedQuiz._id };
      if (editingQuestionId) {
        await api.put(`/admin/questions/${editingQuestionId}`, payload);
        setMessage('Question updated successfully');
      } else {
        await api.post('/admin/questions', payload);
        setMessage('Question added successfully');
      }
      resetQuestionForm();
      await loadQuestions(selectedQuiz._id);
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save question'); }
    finally { setLoading(false); }
  }

  function handleEditQuestion(question) {
    setEditingQuestionId(question._id);
    setQuestionForm({ questionText: question.questionText || '', options: question.options || ['', '', '', ''], correctAnswer: question.correctAnswer || '', isActive: question.isActive === true });
  }

  async function handleToggleQuestion(questionId) {
    try {
      setLoading(true); setMessage(''); setError('');
      await api.patch(`/admin/questions/${questionId}/toggle`);
      setMessage('Question status updated');
      await loadQuestions(selectedQuiz._id);
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to update question'); }
    finally { setLoading(false); }
  }

  async function handleDeleteQuestion(questionId) {
    if (!window.confirm('Delete this question?')) return;
    try {
      setLoading(true); setMessage(''); setError('');
      await api.delete(`/admin/questions/${questionId}`);
      setMessage('Question deleted successfully');
      await loadQuestions(selectedQuiz._id);
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || 'Failed to delete question'); }
    finally { setLoading(false); }
  }

  async function handleImportQuestions() {
    if (!selectedQuiz) { setError('Please select a quiz first'); return; }
    try {
      setLoading(true); setMessage(''); setError('');
      const questionsToImport = JSON.parse(jsonInput);
      await api.post('/admin/questions/import', { quizId: selectedQuiz._id, questions: questionsToImport });
      setJsonInput(''); setMessage('Questions imported successfully');
      await loadQuestions(selectedQuiz._id);
      await loadQuizzes();
    } catch (err) { setError(err.response?.data?.error || err.message || 'Failed to import questions'); }
    finally { setLoading(false); }
  }

  return (
    <section className="card admin-page">
      <div className="admin-header"><div><h2>Quiz Management</h2><p>Create quizzes and manage questions inside each quiz.</p></div></div>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form className="admin-form admin-form-grid" onSubmit={handleQuizSubmit}>
        <h3>{editingQuizId ? 'Edit Quiz' : 'Create Quiz'}</h3>
        <label>Quiz Name<input name="name" value={quizForm.name} onChange={handleQuizFormChange} required /></label>
        <label className="full-span">Description<textarea name="description" value={quizForm.description} onChange={handleQuizFormChange} rows="3" /></label>
        <label className="checkbox-row"><input name="isActive" type="checkbox" checked={quizForm.isActive} onChange={handleQuizFormChange} /> Active quiz</label>
        <div className="actions full-span"><button type="submit" disabled={loading}>{editingQuizId ? 'Update Quiz' : 'Create Quiz'}</button>{editingQuizId && <button type="button" onClick={resetQuizForm}>Cancel Edit</button>}</div>
      </form>

      <h3>Existing Quizzes</h3>
      <div className="quiz-card-grid">
        {quizzes.map((quiz) => (
          <article key={quiz._id} className={selectedQuiz?._id === quiz._id ? 'quiz-admin-card selected-card' : 'quiz-admin-card'}>
            <div className="quiz-card-title-row"><h4>{quiz.name}</h4><span className={quiz.isActive ? 'badge active' : 'badge inactive'}>{quiz.isActive ? 'Active' : 'Inactive'}</span></div>
            <p>{quiz.description || 'No description added.'}</p>
            <div className="quiz-card-stats"><span>Total questions: {quiz.totalQuestions}</span><span>Active questions: {quiz.activeQuestions}</span><span>Inactive questions: {quiz.inactiveQuestions}</span></div>
            <div className="actions"><button type="button" onClick={() => setSelectedQuiz(quiz)}>Manage Questions</button><button type="button" onClick={() => handleEditQuiz(quiz)}>Edit Quiz</button><button type="button" onClick={() => handleToggleQuiz(quiz._id)}>{quiz.isActive ? 'Deactivate Quiz' : 'Activate Quiz'}</button><button type="button" onClick={() => handleDeleteQuiz(quiz._id)}>Delete</button></div>
          </article>
        ))}
        {!quizzes.length && !loading && <div className="empty-state">No quizzes created yet.</div>}
      </div>

      {selectedQuiz && (
        <section className="nested-admin-section">
          <div className="admin-header"><div><h3>Questions for: {selectedQuiz.name}</h3><p>Add, edit, activate, deactivate, delete, or import questions for this quiz.</p></div>{questionStats && <div className="mini-stats"><span>Total: {questionStats.total}</span><span>Active: {questionStats.active}</span><span>Inactive: {questionStats.inactive}</span></div>}</div>

          <form className="admin-form admin-form-grid" onSubmit={handleQuestionSubmit}>
            <h3>{editingQuestionId ? 'Edit Question' : 'Add Question'}</h3>
            <label className="full-span">Question Text<textarea name="questionText" value={questionForm.questionText} onChange={handleQuestionFormChange} rows="3" required /></label>
            {questionForm.options.map((option, index) => <label key={index}>Option {index + 1}<input value={option} onChange={(event) => handleOptionChange(index, event.target.value)} required /></label>)}
            <label>Correct Answer<select name="correctAnswer" value={questionForm.correctAnswer} onChange={handleQuestionFormChange} required><option value="">Select correct answer</option>{questionForm.options.map((option, index) => <option key={index} value={option}>{option || `Option ${index + 1}`}</option>)}</select></label>
            <label className="checkbox-row"><input name="isActive" type="checkbox" checked={questionForm.isActive} onChange={handleQuestionFormChange} /> Active question</label>
            <div className="actions full-span"><button type="submit" disabled={loading}>{editingQuestionId ? 'Update Question' : 'Add Question'}</button>{editingQuestionId && <button type="button" onClick={resetQuestionForm}>Cancel Edit</button>}</div>
          </form>

          <div className="admin-form">
            <h3>Import Questions from JSON</h3>
            <p>Paste an array of questions. Each question needs questionText, options, correctAnswer, and isActive.</p>
            <textarea value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} rows="8" placeholder='[{"questionText":"Example?","options":["A","B","C","D"],"correctAnswer":"A","isActive":true}]' />
            <div className="actions"><button type="button" onClick={handleImportQuestions}>Import Questions</button></div>
          </div>

          <h3>Existing Questions</h3>
          <div className="table-wrapper"><table className="admin-table"><thead><tr><th>Question</th><th>Status</th><th>Correct Answer</th><th>Actions</th></tr></thead><tbody>{questions.map((question) => <tr key={question._id}><td>{question.questionText}</td><td><span className={question.isActive ? 'badge active' : 'badge inactive'}>{question.isActive ? 'Active' : 'Inactive'}</span></td><td>{question.correctAnswer}</td><td><div className="table-actions"><button type="button" onClick={() => handleEditQuestion(question)}>Edit</button><button type="button" onClick={() => handleToggleQuestion(question._id)}>{question.isActive ? 'Deactivate' : 'Activate'}</button><button type="button" onClick={() => handleDeleteQuestion(question._id)}>Delete</button></div></td></tr>)}{!questions.length && <tr><td colSpan="4">No questions added for this quiz yet.</td></tr>}</tbody></table></div>
        </section>
      )}
    </section>
  );
}
EOF

cat > frontend/src/pages/LeaderboardPage.jsx <<'EOF'
import { useEffect, useState } from 'react';
import { leaderboardApi } from '../api/leaderboardApi';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError('');
        const response = await leaderboardApi.getLeaderboard();
        setLeaderboard(response.data.data.leaderboard || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  return (
    <section className="card">
      <h2>Leaderboard</h2>
      <p>Ranking is based on final timed quiz score, including correct answers and time bonus.</p>
      {loading && <p>Loading leaderboard...</p>}
      {error && <p className="error-message">{error}</p>}
      <LeaderboardTable leaderboard={leaderboard} />
    </section>
  );
}
EOF

cat > frontend/src/components/leaderboard/LeaderboardTable.jsx <<'EOF'
export default function LeaderboardTable({ leaderboard }) {
  if (!leaderboard.length) return <p>No leaderboard attempts found yet.</p>;

  return (
    <div className="table-wrapper">
      <table className="admin-table">
        <thead><tr><th>Rank</th><th>User</th><th>Quiz</th><th>Score</th><th>Correct</th><th>Time Bonus</th><th>Date</th></tr></thead>
        <tbody>
          {leaderboard.map((attempt, index) => (
            <tr key={attempt._id}>
              <td>{index + 1}</td>
              <td>{attempt.username}</td>
              <td>{attempt.quizName || 'Timed Quiz'}</td>
              <td>{attempt.score}</td>
              <td>{attempt.correctAnswers} / {attempt.totalQuestions}</td>
              <td>+{attempt.timeBonus || 0}</td>
              <td>{new Date(attempt.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF

cat > frontend/src/pages/AttemptsPage.jsx <<'EOF'
import { useEffect, useState } from 'react';
import { scoreApi } from '../api/scoreApi';
import AttemptCard from '../components/attempts/AttemptCard';

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAttempts() {
      try {
        setLoading(true);
        setError('');
        const response = await scoreApi.getUserAttempts();
        setAttempts(response.data.data.attempts || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load attempts');
      } finally {
        setLoading(false);
      }
    }
    loadAttempts();
  }, []);

  return (
    <section className="card">
      <h2>My Attempts</h2>
      <p>This page shows previous timed quiz attempts, including score and time bonus.</p>
      {loading && <p>Loading attempts...</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="quiz-card-grid">
        {attempts.map((attempt) => <AttemptCard key={attempt._id} attempt={attempt} />)}
        {!attempts.length && !loading && <div className="empty-state">No attempts found yet.</div>}
      </div>
    </section>
  );
}
EOF

cat > frontend/src/components/attempts/AttemptCard.jsx <<'EOF'
export default function AttemptCard({ attempt }) {
  return (
    <article className="quiz-admin-card">
      <div className="quiz-card-title-row"><h3>{attempt.quizName || 'Timed Quiz'}</h3><span className="badge active">Score: {attempt.score}</span></div>
      <p>Correct answers: {attempt.correctAnswers} / {attempt.totalQuestions}</p>
      <p>Time bonus: +{attempt.timeBonus || 0}</p>
      <p>Completed at: {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : '-'}</p>
      {attempt.answers?.length > 0 && <details><summary>View submitted answers</summary><ul>{attempt.answers.map((answer, index) => <li key={`${answer.questionId?._id || answer.questionId}-${index}`}><strong>{answer.questionId?.questionText || `Question ${index + 1}`}:</strong> {answer.selectedAnswer} {answer.isCorrect ? '(Correct)' : '(Incorrect)'}</li>)}</ul></details>}
    </article>
  );
}
EOF

cat > frontend/src/components/admin/QuestionForm.jsx <<'EOF'
export default function QuestionForm() {
  return <p>Questions are managed inside the Quiz Management page.</p>;
}
EOF

cat > frontend/src/components/admin/QuestionTable.jsx <<'EOF'
export default function QuestionTable() {
  return <p>Open Quiz Management to view and edit questions for a selected quiz.</p>;
}
EOF

cat > frontend/src/components/admin/BulkImportForm.jsx <<'EOF'
export default function BulkImportForm() {
  return <p>Bulk import is available inside the selected quiz on the Quiz Management page.</p>;
}
EOF

cat > frontend/src/schemas/questionSchema.js <<'EOF'
export function validateQuestionForm(question) {
  const errors = {};

  if (!question.questionText || question.questionText.trim().length < 5) {
    errors.questionText = 'Question text must be at least 5 characters';
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    errors.options = 'Exactly 4 options are required';
  }

  if (!question.correctAnswer) {
    errors.correctAnswer = 'Correct answer is required';
  }

  return errors;
}
EOF

cat > frontend/src/index.css <<'EOF'
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, sans-serif; background: #f3f4f6; color: #111827; }
[data-theme='dark'] body, [data-theme='dark'] { background: #111827; color: #f9fafb; }
a { color: inherit; }
.container { max-width: 1120px; margin: 0 auto; padding: 24px; }
.card, .auth-card, .feature-card, .quiz-admin-card, .stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
[data-theme='dark'] .card, [data-theme='dark'] .auth-card, [data-theme='dark'] .feature-card, [data-theme='dark'] .quiz-admin-card, [data-theme='dark'] .stat-card { background: #1f2937; border-color: #374151; }
.navbar { background: #111827; color: white; }
.nav-container { max-width: 1120px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.nav-logo { font-weight: bold; text-decoration: none; font-size: 1.2rem; }
.nav-links, .nav-actions, .hero-actions, .result-actions, .actions, .table-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.nav-link, .button-link { text-decoration: none; border-radius: 8px; padding: 8px 12px; border: 1px solid transparent; }
.nav-link:hover, .button-link:hover { border-color: #9ca3af; }
.nav-btn, button, .btn { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; background: #2563eb; color: white; text-decoration: none; display: inline-block; }
button:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-secondary { background: #4b5563; }
.nav-btn-primary { background: #2563eb; color: white; }
.auth-page { min-height: 70vh; display: grid; place-items: center; }
.auth-card { width: min(460px, 100%); }
.form-group, .admin-form label { display: grid; gap: 6px; margin-bottom: 12px; }
input, select, textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
.error-message, .error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px; padding: 10px; }
.success-message, .success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; }
.hero-section { text-align: center; margin-bottom: 18px; }
.features-grid, .dashboard-grid, .quiz-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 16px; }
.quiz-card-title-row, .result-row, .admin-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.quiz-card-stats { display: grid; gap: 6px; margin: 12px 0; }
.badge { border-radius: 999px; padding: 5px 10px; font-size: 0.85rem; }
.badge.active { background: #dcfce7; color: #166534; }
.badge.inactive { background: #fee2e2; color: #991b1b; }
.admin-page { margin: 20px auto; }
.admin-form { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin: 18px 0; }
.admin-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.full-span, .admin-form h3 { grid-column: 1 / -1; }
.checkbox-row { display: flex !important; align-items: center; gap: 8px; }
.checkbox-row input { width: auto; }
.table-wrapper { overflow-x: auto; }
.admin-table { border-collapse: collapse; width: 100%; }
.admin-table th, .admin-table td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.option-list { display: grid; gap: 12px; margin-top: 16px; }
.option-item { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; display: flex; gap: 10px; align-items: center; }
.option-item input { width: auto; }
.quiz-progress-wrapper { margin: 16px 0; }
.quiz-progress { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.progress-bar { background: #e5e7eb; border-radius: 999px; height: 10px; overflow: hidden; }
.progress-fill { background: #2563eb; height: 100%; transition: width 0.25s ease; }
.timer-warning { color: #b91c1c; }
.timer-warning-message, .quiz-feedback { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: 8px; padding: 10px; }
.result-summary { display: grid; gap: 10px; margin: 16px 0; }
.result-row { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.result-final-score { background: #ecfdf5; border-color: #bbf7d0; }
.empty-state { border: 1px dashed #9ca3af; border-radius: 12px; padding: 18px; }
.selected-card { border-color: #60a5fa; box-shadow: 0 0 0 2px rgba(96,165,250,0.25); }
.nested-admin-section { border-top: 1px solid #e5e7eb; margin-top: 28px; padding-top: 22px; }
.mini-stats { display: flex; flex-wrap: wrap; gap: 10px; }
.mini-stats span { border: 1px solid #9ca3af; border-radius: 999px; padding: 6px 10px; }
details { margin-top: 12px; }
details summary { cursor: pointer; font-weight: 600; }
@media (max-width: 640px) { .container { padding: 14px; } .nav-container { align-items: flex-start; } }
EOF

cat > backend/README.md <<'EOF'
# Backend API

This backend supports the Timed Questions quiz variation.

Main endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/quiz/available`
- `GET /api/quiz/:quizId`
- `POST /api/scores`
- `GET /api/scores/me`
- `GET /api/leaderboard`
- `GET /api/admin/quizzes`
- `POST /api/admin/quizzes`
- `GET /api/admin/questions?quizId=<id>`
- `POST /api/admin/questions`
- `POST /api/admin/questions/import`

Question structure:

```json
{
  "quizId": "QUIZ_ID",
  "questionText": "Question text",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "isActive": true
}
```
EOF

cat > frontend/README.md <<'EOF'
# Frontend

This frontend uses the Timed Questions variation.

Users can:

- register and login
- choose an available timed quiz
- answer timed questions
- view final score and time bonus
- view previous attempts
- view leaderboard

Admins can:

- create quizzes
- activate/deactivate quizzes
- add, edit, delete, activate, and deactivate questions inside each quiz
- import questions from JSON
EOF

# Remove old unused files or leave safe placeholders.
rm -f frontend/src/components/quiz/Timer.jsx 2>/dev/null || true

# Final cleanup: remove category/difficulty/correctOption words from harmless docs if any remain.
python3 - <<'PY'
from pathlib import Path
for path in list(Path('backend').rglob('*')) + list(Path('frontend').rglob('*')):
    if path.is_file() and path.suffix in {'.js', '.jsx', '.css', '.md'}:
        text = path.read_text(errors='ignore')
        text = text.replace('correctOption', 'correctAnswer')
        text = text.replace('Correct Option', 'Correct Answer')
        text = text.replace('correct option', 'correct answer')
        text = text.replace('Category-based', 'Quiz-based')
        text = text.replace('category-based', 'quiz-based')
        text = text.replace('categories', 'quizzes')
        text = text.replace('Categories', 'Quizzes')
        text = text.replace('category', 'quiz')
        text = text.replace('Category', 'Quiz')
        text = text.replace('difficulty', 'level')
        text = text.replace('Difficulty', 'Level')
        path.write_text(text)
PY

echo "Updated project to remove category logic and align with timed quiz structure."
