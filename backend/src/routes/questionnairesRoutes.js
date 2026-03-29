import express from 'express';
import { getQuestionnaires, getQuestionnaireById } from '../controllers/questionnairesController.js';

const router = express.Router();

router.get('/', getQuestionnaires);
router.get('/:qId', getQuestionnaireById);

export default router;
