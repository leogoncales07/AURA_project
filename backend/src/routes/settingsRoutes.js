import express from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);

export default router;
