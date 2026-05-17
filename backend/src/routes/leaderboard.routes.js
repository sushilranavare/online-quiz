import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getLeaderboard));

export default router;
