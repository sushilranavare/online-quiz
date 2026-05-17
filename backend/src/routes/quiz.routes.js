import express from 'express';
import { getCategories, getQuestionsByCategory } from '../controllers/quiz.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/:category', authMiddleware, getQuestionsByCategory);

export default router;