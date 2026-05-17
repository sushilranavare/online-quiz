import express from 'express';
import { submitScore, getUserScores, getScoreById } from '../controllers/score.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, submitScore);
router.get('/', authMiddleware, getUserScores);
router.get('/:id', authMiddleware, getScoreById);

export default router;