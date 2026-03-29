import express from 'express';
import { getLibraryContent } from '../controllers/libraryController.js';

const router = express.Router();

router.get('/content', getLibraryContent);

export default router;
