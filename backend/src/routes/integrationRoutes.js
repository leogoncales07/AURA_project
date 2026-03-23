import express from 'express';
import * as integrationController from '../controllers/integrationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', integrationController.getIntegrations);
router.post('/:provider/connect', integrationController.connectProvider);
router.delete('/:provider', integrationController.disconnectProvider);

export default router;
