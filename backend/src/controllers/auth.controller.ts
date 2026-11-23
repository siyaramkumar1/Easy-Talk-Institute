import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { EmailVerification } from '../models/emailVerification.model';
import { otpService } from '../services/otp.service';
import { emailService } from '../services/email.service';
import { jwtService } from '../services/jwt.service';
import { MOBILE_REGEX } from '../utils/validation';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie';
import { extractAuthToken, extractOptionalUser, isValidSameOriginOrHeader } from '../middleware/auth';

export class AuthController {
  /**
   * STEP 2, 3, 4: Send 6-digit OTP using Gmail SMTP
   * POST /api/auth/send-verification-otp
   */
  async sendVerificationOtp(req: Request, res: Response): Promise<Response> {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: 'Database service is temporarily unavailable. Please try again shortly.',
        });
      }

      let { email, name, fullName } = req.body;
      const studentName = (fullName || name || 'Student').trim();

      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Email address is required' });
      }

      email = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
      }

      // Check if user is already registered in User collection
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.isVerified !== false) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please log in.',
        });
      }

      // Check 60-second resend cooldown
      const cooldownRemaining = await otpService.checkResendCooldown(email);
      if (cooldownRemaining !== null) {
        return res.status(429).json({
          success: false,
          cooldownRemaining,
          message: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`,
        });
      }

      // Generate 6-digit crypto-secure OTP & store bcrypt hash in MongoDB
      const { otp } = await otpService.createOrUpdateOtp(email);

      // Send OTP using Gmail API
      const emailResult = await emailService.sendOtpEmail(email, otp, studentName);

      if (!emailResult.success) {
        console.error('[REGISTRATION OTP DELIVERY FAILED]', emailResult.error);
        return res.status(503).json({
          success: false,
          email,
          deliverySuccess: false,
          message: 'Unable to send verification email right now. Please try again shortly.',
        });
      }

      return res.json({
        success: true,
        email,
        deliverySuccess: true,
        message: 'Verification code sent to your email.',
      });
    } catch (err: any) {
      console.error('Error in sendVerificationOtp:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code. Please try again.',
      });
    }
  }

  /**
   * STEP 8: Verify 6-digit OTP with bcrypt comparison & attempt tracking
   * POST /api/auth/verify-email-otp
   */
  async verifyEmailOtp(req: Request, res: Response): Promise<Response> {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: 'Database service is temporarily unavailable. Please try again shortly.',
        });
      }

      let { email, otp, code, verificationCode } = req.body;
      let rawOtp = otp ?? code ?? verificationCode;
      if (Array.isArray(rawOtp)) {
        rawOtp = rawOtp.join('');
      }

      if (!email || !email.toString().trim()) {
        return res.status(400).json({ success: false, message: 'Email address is required' });
      }
      if (!rawOtp || !rawOtp.toString().trim()) {
        return res.status(400).json({ success: false, message: 'Verification code is required' });
      }

      const cleanEmail = email.toString().trim().toLowerCase();
      const cleanOtp = rawOtp.toString().trim();

      const result = await otpService.verifyOtp(cleanEmail, cleanOtp);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          remainingAttempts: result.remainingAttempts,
          maxAttemptsReached: result.maxAttemptsReached,
          isExpired: result.isExpired,
        });
      }

      // Check if user already exists in User collection to enable auto-login
      let user = await User.findOne({ email: cleanEmail });
      let token = null;

      if (user) {
        user.isVerified = true;
        user.emailVerified = true;
        await user.save();

        token = jwtService.generateToken({
          userId: user._id.toString(),
          email: user.email,
          role: user.role || 'student',
        });
      }

      return res.json({
        success: true,
        message: 'Email verified successfully',
        verified: true,
        token,
        user: user ? {
          id: user._id,
          _id: user._id,
          name: user.name || user.fullName,
          fullName: user.fullName || user.name,
          email: user.email,
          mobile: user.mobile || user.mobileNumber,
          role: user.role || 'student',
          status: user.status || 'Active',
          isVerified: true,
        } : undefined,
      });
    } catch (err: any) {
      console.error('Error in verifyEmailOtp:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error during OTP verification',
      });
    }
  }

  /**
   * Check if email is currently verified
   * GET /api/auth/check-verification?email=...
   */
  async checkVerificationStatus(req: Request, res: Response): Promise<Response> {
    try {
      const email = (req.query.email as string)?.trim().toLowerCase();
      if (!email) {
        return res.json({ verified: false });
      }
      const verified = await otpService.isEmailVerified(email);
      return res.json({ verified });
    } catch {
      return res.json({ verified: false });
    }
  }

  /**
   * STEP 13, 14, 15, 16: Complete Registration after Email Verified
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<Response> {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: 'Database service is temporarily unavailable. Please try again shortly.',
        });
      }

      let {
        fullName,
        name,
        mobileNumber,
        mobile,
        whatsapp,
        email,
        password,
        confirmPassword,
      } = req.body;

      const studentName = (fullName || name || '').trim();
      const studentMobile = (mobileNumber || mobile || '').trim();

      // Field Validations
      if (!studentName) {
        return res.status(400).json({ success: false, message: 'Full Name is required' });
      }

      if (!studentMobile) {
        return res.status(400).json({ success: false, message: 'Mobile Number is required' });
      }

      if (!MOBILE_REGEX.test(studentMobile)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number (must be 10 digits)' });
      }

      if (whatsapp && !MOBILE_REGEX.test(whatsapp.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid WhatsApp number' });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Email address is required' });
      }
      email = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }

      if (confirmPassword && password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Password and confirm password do not match' });
      }

      // MANDATORY RULE: Email must be verified FIRST in EmailVerification collection
      const isVerified = await otpService.isEmailVerified(email);
      if (!isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your email address before registering.',
        });
      }

      // Check unique email in User collection
      const existingUserByEmail = await User.findOne({ email });
      if (existingUserByEmail && existingUserByEmail.isVerified !== false) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please log in.',
        });
      }

      // Check unique mobile in User collection
      const existingUserByMobile = await User.findOne({
        $or: [{ mobile: studentMobile }, { mobileNumber: studentMobile }],
      });
      if (existingUserByMobile && existingUserByMobile.email !== email) {
        return res.status(400).json({
          success: false,
          message: 'An account with this mobile number already exists. Please use a different number or log in.',
        });
      }

      // Hash password using bcrypt with 12 rounds as specified in prompt
      const hashedPassword = await bcrypt.hash(password, 12);

      let user: any;

      if (existingUserByEmail) {
        // Upgrade previously unverified legacy record
        existingUserByEmail.fullName = studentName;
        existingUserByEmail.name = studentName;
        existingUserByEmail.mobileNumber = studentMobile;
        existingUserByEmail.mobile = studentMobile;
        if (whatsapp) existingUserByEmail.whatsapp = whatsapp.trim();
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.emailVerified = true;
        existingUserByEmail.isVerified = true;
        existingUserByEmail.role = 'student';
        await existingUserByEmail.save();
        user = existingUserByEmail;
      } else {
        // CREATE USER ONLY AFTER OTP VERIFICATION
        user = new User({
          fullName: studentName,
          name: studentName,
          mobileNumber: studentMobile,
          mobile: studentMobile,
          whatsapp: (whatsapp || studentMobile).trim(),
          email,
          password: hashedPassword,
          role: 'student',
          emailVerified: true,
          isVerified: true,
        });
        await user.save();
      }

      // Clean up EmailVerification record now that registration is complete
      await otpService.cleanupVerification(email);

      // Generate JWT Token
      const token = jwtService.generateToken({
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      // Audit log
      const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog');
      if (ActivityLog) {
        await ActivityLog.create({
          action: 'Register (Completed)',
          module: 'Auth',
          performedBy: user.name,
          role: user.role,
          ip: req.ip,
        }).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        message: 'Registration successful. Welcome to Easy Talk Institute!',
        token,
        user: {
          id: user._id,
          name: user.name,
          fullName: user.fullName || user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error('Error during registration:', err);
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'email';
        return res.status(400).json({
          success: false,
          message: `An account with this ${field} already exists.`,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server error during registration. Please try again.',
      });
    }
  }

  /**
   * User Login
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      let { email, password, rememberMe } = req.body;
      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      email = email.trim().toLowerCase();
      const isRememberMe = rememberMe === true || rememberMe === 'true';

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.status === 'Inactive') {
        return res.status(403).json({ success: false, message: 'Your account is currently inactive. Please contact support.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Check if email verified
      if (user.role === 'admin' || user.role === 'superadmin' || user.isVerified === undefined || user.isVerified === null) {
        if (!user.isVerified) {
          user.isVerified = true;
          user.emailVerified = true;
          await user.save();
        }
      } else if (user.isVerified === false && user.emailVerified === false) {
        // Unverified user requesting login: send a fresh OTP
        const { otp } = await otpService.createOrUpdateOtp(user.email);
        const emailResult = await emailService.sendOtpEmail(user.email, otp, user.name);

        if (!emailResult.success) {
          console.error('[LOGIN OTP DELIVERY FAILED]', emailResult.error);
          return res.status(503).json({
            success: false,
            isUnverified: true,
            email: user.email,
            deliverySuccess: false,
            message: 'Your email is not verified. We could not send a verification code right now. Please try again shortly.',
          });
        }

        return res.status(403).json({
          success: false,
          isUnverified: true,
          email: user.email,
          deliverySuccess: true,
          message: 'Your email is not verified yet. A verification code has been sent to your email.',
        });
      }

      const token = jwtService.generateToken(
        {
          userId: user._id.toString(),
          role: user.role,
          email: user.email,
        },
        isRememberMe ? '30d' : '1d'
      );

      setAuthCookie(req, res, token, isRememberMe);

      const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog');
      if (ActivityLog) {
        await ActivityLog.create({
          action: 'Login',
          module: 'Auth',
          performedBy: user.name,
          role: user.role,
          ip: req.ip,
        }).catch(() => {});
      }

      return res.json({
        success: true,
        token,
        rememberMe: isRememberMe,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          fullName: user.fullName || user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (err: any) {
      console.error('Error during login:', err);
      return res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }

  /**
   * Get Current User Profile
   * GET /api/auth/me
   */
  async getMe(req: any, res: Response): Promise<Response> {
    try {
      const user = await User.findById(req.user.id).select('name fullName email mobile role avatar').lean();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({
        id: (user as any)._id,
        _id: (user as any)._id,
        name: (user as any).name,
        fullName: (user as any).fullName || (user as any).name,
        email: (user as any).email,
        mobile: (user as any).mobile,
        role: (user as any).role,
        avatar: (user as any).avatar,
      });
    } catch {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(req: any, res: Response): Promise<Response> {
    if (!req.header('Authorization') && !req.header('authorization') && !isValidSameOriginOrHeader(req)) {
      return res.status(403).json({ success: false, message: 'CSRF validation failed for logout' });
    }

    const activeUser = req.user || extractOptionalUser(req);
    const rawToken = extractAuthToken(req);
    if (rawToken) {
      try {
        const decoded = jwtService.verifyToken(rawToken);
        if (decoded?.jti) {
          await jwtService.revokeToken(decoded.jti, decoded.exp);
        }
      } catch {
        // Token already expired or invalid
      }
    }

    clearAuthCookie(req, res);

    const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog');
    if (ActivityLog && activeUser) {
      await ActivityLog.create({
        action: 'Logout',
        module: 'Auth',
        performedBy: activeUser.email || activeUser.id || 'User',
        role: activeUser.role || 'student',
        ip: req.ip,
      }).catch(() => {});
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  }

  /**
   * Resend Verification OTP
   * POST /api/auth/resend-verification-otp
   */
  async resendVerificationOtp(req: Request, res: Response): Promise<Response> {
    return this.sendVerificationOtp(req, res);
  }

  /**
   * Request Password Reset OTP
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ success: false, message: 'Database service is temporarily unavailable.' });
      }

      let { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
      }

      email = email.trim().toLowerCase();
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
        });
      }

      // Check 60-second cooldown
      const cooldownRemaining = await otpService.checkResendCooldown(email);
      if (cooldownRemaining !== null) {
        return res.status(429).json({
          success: false,
          cooldownRemaining,
          message: `Please wait ${cooldownRemaining} seconds before requesting a new code.`,
        });
      }

      const { otp } = await otpService.createOrUpdateOtp(email);
      const emailResult = await emailService.sendOtpEmail(email, otp, user.name || 'Student');

      if (!emailResult.success) {
        console.error('[FORGOT PASSWORD OTP DELIVERY FAILED]', emailResult.error);
        return res.status(503).json({
          success: false,
          message: 'Unable to process the password reset email right now. Please try again later.',
        });
      }

      return res.json({
        success: true,
        message: 'A 6-digit password reset code has been sent to your email.',
      });
    } catch (err: any) {
      console.error('Error in forgotPassword:', err);
      return res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
    }
  }

  /**
   * Reset Password with OTP Verification
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ success: false, message: 'Database service is temporarily unavailable.' });
      }

      let { email, otp, code, newPassword, password, confirmPassword } = req.body;
      const targetPassword = newPassword || password;
      const targetOtp = otp || code;

      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
      }
      if (!targetOtp || !targetOtp.toString().trim()) {
        return res.status(400).json({ success: false, message: '6-digit OTP code is required.' });
      }
      if (!targetPassword || targetPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
      }
      if (confirmPassword && targetPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = targetOtp.toString().trim().replace(/\D/g, '');

      const verifyResult = await otpService.verifyOtp(cleanEmail, cleanOtp);
      if (!verifyResult.success) {
        return res.status(400).json({
          success: false,
          message: verifyResult.message,
          remainingAttempts: verifyResult.remainingAttempts,
        });
      }

      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const hashedPassword = await bcrypt.hash(targetPassword, 12);
      user.password = hashedPassword;
      await user.save();

      // Clean up OTP record
      await otpService.cleanupVerification(cleanEmail);

      const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog');
      if (ActivityLog) {
        await ActivityLog.create({
          action: 'Password Reset',
          module: 'Auth',
          performedBy: user.name,
          role: user.role,
          ip: req.ip,
        }).catch(() => {});
      }

      return res.json({
        success: true,
        message: 'Password reset successful! You can now log in with your new password.',
      });
    } catch (err: any) {
      console.error('Error in resetPassword:', err);
      return res.status(500).json({ success: false, message: 'Server error while resetting password.' });
    }
  }
}

export const authController = new AuthController();
export default authController;
