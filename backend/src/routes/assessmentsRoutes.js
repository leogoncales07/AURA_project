import express from 'express';
import { submitAssessment, getAssessmentHistory } from '../controllers/assessmentsController.js';

const router = express.Router();

router.post('/submit', submitAssessment);
router.get('/:userId/history', getAssessmentHistory);

export default router;
