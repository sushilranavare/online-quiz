import express from 'express';
import { 
    getGlobalLeaderboard, 
    getCategoryLeaderboard, 
    getUserRank,
    getCategories
} from '../controllers/leaderboard.controller.js';

const router = express.Router();

// Get global leaderboard
router.get('/', getGlobalLeaderboard);

// Get categories
router.get('/categories', getCategories);

// Get user's rank
router.get('/rank/:userId', getUserRank);

// Get leaderboard by category
router.get('/category/:category', getCategoryLeaderboard);

export default router;