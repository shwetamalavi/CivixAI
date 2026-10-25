import express from 'express';
import { upload } from '../config/multer.js';
import {
  previewAiAnalysis,
  getAiStatus,
  updateAiKey,
  toggleAiFailureSimulation,
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/analyze-preview', upload.single('photo'), previewAiAnalysis);
router.get('/status', getAiStatus);
router.post('/set-key', updateAiKey);
router.post('/simulate-failure', toggleAiFailureSimulation);

export default router;
