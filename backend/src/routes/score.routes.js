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
