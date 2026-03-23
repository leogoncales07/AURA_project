import express from 'express';
import * as accountController from '../controllers/accountController.js';
import * as twoFactorController from '../controllers/twoFactorController.js';
import * as sessionController from '../controllers/sessionController.js';
import * as privacyController from '../controllers/privacyController.js';
import { protect } from '../middleware/authMiddleware.js';

import { uploadUserPhoto } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profile', accountController.getProfile);
router.patch('/profile', accountController.updateProfile);

// Avatar
router.post('/avatar', uploadUserPhoto, accountController.resizeUserPhoto, accountController.uploadAvatar);
router.delete('/avatar', accountController.deleteAvatar);

router.post('/email/change', accountController.changeEmailRequest);

// 2FA
router.post('/2fa/setup', twoFactorController.setup2FA);
router.post('/2fa/verify-setup', twoFactorController.verifySetup2FA);

// Sessions
router.get('/sessions', sessionController.getSessions);
router.delete('/sessions/:sessionId', sessionController.revokeSession);
router.delete('/sessions', sessionController.revokeAllOtherSessions);

// Privacy & Export
router.post('/export', privacyController.requestDataExport);
router.delete('/wellness-data', privacyController.deleteWellnessData);
router.post('/delete', privacyController.deleteAccount);

export default router;
