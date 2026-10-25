import { dbStore } from '../services/dbStore.js';
import { notificationService } from '../services/notificationService.js';

export const getAnalyticsOverview = async (req, res) => {
  try {
    const stats = await dbStore.getAnalytics();
    const departments = await dbStore.getDepartments();
    res.json({
      success: true,
      data: {
        ...stats,
        departments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAuditLogs = (req, res) => {
  try {
    const logs = notificationService.getRecentLogs(30);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getDepartmentsList = async (req, res) => {
  try {
    const departments = await dbStore.getDepartments();
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
