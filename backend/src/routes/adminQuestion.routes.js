import express from 'express';
import { 
    getAllQuestions, 
    getQuestionById, 
    createQuestion, 
    updateQuestion, 
    deleteQuestion, 
    toggleQuestionStatus,
    bulkImportQuestions,
    getQuestionStats
} from '../controllers/adminQuestion.controller.js';
import { validateQuestion, validateBulkImport } from '../validations/question.validation.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Apply rate limiting to all admin routes
router.use(rateLimit);

// Get all questions
router.get('/', getAllQuestions);

// Get question statistics
router.get('/stats', getQuestionStats);

// Get single question
router.get('/:id', getQuestionById);

// Create question
router.post('/', validateQuestion, createQuestion);

// Update question
router.put('/:id', validateQuestion, updateQuestion);

// Delete question
router.delete('/:id', deleteQuestion);

// Toggle question status
router.patch('/:id/toggle', toggleQuestionStatus);

// Bulk import questions
router.post('/bulk', validateBulkImport, bulkImportQuestions);

export default router;