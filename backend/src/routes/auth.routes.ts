import express from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { User } from '../models/user.model';
import mongoose from 'mongoose';

const router = express.Router();

// Production Email OTP Verification Flow (Gmail SMTP + Nodemailer)
router.post('/send-verification-otp', (req, res) => authController.sendVerificationOtp(req, res));
router.post('/verify-email-otp', (req, res) => authController.verifyEmailOtp(req, res));
router.post('/resend-verification-otp', (req, res) => authController.resendVerificationOtp(req, res));
router.get('/check-verification', (req, res) => authController.checkVerificationStatus(req, res));

// User Registration & Authentication
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

// Legacy / Alternative OTP endpoint wrappers
router.post('/verify-otp', (req, res) => authController.verifyEmailOtp(req, res));
router.post('/resend-otp', (req, res) => authController.sendVerificationOtp(req, res));

// User Management (Admin / Superadmin)
router.get('/users', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch {
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

router.patch('/users/:id/role', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'student', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.role = role;
    await user.save();
    res.json({ success: true, message: 'Role updated successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/users/:id', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
