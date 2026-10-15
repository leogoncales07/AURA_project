import express from 'express';
import * as companionController from '../controllers/companionController.js';

const router = express.Router();

router.post('/chat', companionController.chat);
router.post('/log', companionController.logMood);
router.get('/:userId/logs', companionController.getLogs);
router.post('/sleep', companionController.logSleep);
router.get('/:userId/sleep', companionController.getSleepLogs);
router.get('/:userId/stats', companionController.getStats);
router.post('/reflection', companionController.saveReflection);
router.get('/:userId/conversations', companionController.getConversations);
router.get('/:userId/conversations/:conversationId', companionController.getConversationMessages);
router.delete('/:userId/conversations/:conversationId', companionController.deleteConversation);

export default router;
