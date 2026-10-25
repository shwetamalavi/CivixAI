import express from 'express';
import { getAnalyticsOverview, getAuditLogs, getDepartmentsList } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/overview', getAnalyticsOverview);
router.get('/audit-logs', getAuditLogs);
router.get('/departments', getDepartmentsList);

export default router;
