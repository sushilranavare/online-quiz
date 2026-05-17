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
