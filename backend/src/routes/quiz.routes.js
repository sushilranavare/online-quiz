import express from 'express';
import {
  getAvailableQuizzes,
  getQuizzes,
  getQuizQuestions,
  getQuizQuestionsByQuiz
} from '../controllers/quiz.controller.js';

const router = express.Router();

router.get('/available', getAvailableQuizzes);
router.get('/quizzes', getQuizzes);
router.get('/', getQuizQuestions);
router.get('/:quizId', getQuizQuestionsByQuiz);

export default router;
