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
