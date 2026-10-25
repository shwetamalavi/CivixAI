import express from 'express';
import {
  sendOtp,
  verifyOtp,
  citizenLogin,
  adminLogin,
  getDemoAccounts,
  getSmsStatus,
  updateSmsKey,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/citizen-login', citizenLogin);
router.post('/admin-login', adminLogin);
router.get('/demo-accounts', getDemoAccounts);
router.get('/sms-status', getSmsStatus);
router.post('/set-sms-key', updateSmsKey);

export default router;
