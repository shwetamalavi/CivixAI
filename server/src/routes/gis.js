import express from 'express';
import { getGisConfig, updateGisConfig } from '../controllers/gisController.js';

const router = express.Router();

router.get('/config', getGisConfig);
router.post('/config', updateGisConfig);

export default router;
