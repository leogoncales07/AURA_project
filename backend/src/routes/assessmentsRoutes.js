import express from 'express';
import { submitAssessment, getAssessmentHistory } from '../controllers/assessmentsController.js';
import { protect, requireOwnData } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);
router.param('userId', requireOwnData);
router.use(requireOwnData);

router.post('/submit', submitAssessment);
router.get('/:userId/history', getAssessmentHistory);

export default router;
