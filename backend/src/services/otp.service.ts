import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { EmailVerification, IEmailVerification } from '../models/emailVerification.model';

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
  maxAttemptsReached?: boolean;
  isExpired?: boolean;
}

export interface SendOtpResult {
  success: boolean;
  message: string;
  cooldownRemaining?: number;
}

const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFICATION_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

class OtpService {
  /**
   * Generates a crypto-secure 6-digit numeric OTP
   */
  generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes plain OTP using bcrypt (never stored in plaintext)
   */
  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  /**
   * Compares plain OTP against stored bcrypt hash
   */
  async compareOtp(otp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(otp, hashedOtp);
  }

  /**
   * Checks if an email is on resend cooldown
   */
  async checkResendCooldown(email: string): Promise<number | null> {
    const existing = await EmailVerification.findOne({ email: email.toLowerCase().trim() });
    if (!existing || !existing.updatedAt) {
      return null;
    }
    const secondsSinceLastRequest = (Date.now() - new Date(existing.updatedAt).getTime()) / 1000;
    if (secondsSinceLastRequest < RESEND_COOLDOWN_SECONDS) {
      return Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastRequest);
    }
    return null;
  }

  /**
   * Creates a new OTP record or invalidates any previous OTP for the email,
   * guaranteeing that only the latest OTP works.
   */
  async createOrUpdateOtp(email: string): Promise<{ otp: string; verification: IEmailVerification }> {
    const normalizedEmail = email.toLowerCase().trim();
    const otp = this.generateSecureOtp();
    const hashedOtp = await this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert record: overwrite previous otpHash immediately invalidating past codes
    const verification = await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otpHash: hashedOtp,
        hashedOtp,
        expiresAt,
        attempts: 0, // Reset attempts for the new code
        isVerified: false,
        $inc: { resendCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { otp, verification };
  }

  /**
   * Verifies the 6-digit OTP against the stored bcrypt hash
   */
  async verifyOtp(email: string, otp: string): Promise<VerifyOtpResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim().replace(/\D/g, '');

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return {
        success: false,
        message: 'Invalid code format. OTP must be exactly 6 numeric digits.',
      };
    }

    const verification = await EmailVerification.findOne({ email: normalizedEmail });
    if (!verification) {
      return {
        success: false,
        message: 'No active verification request found. Please request a new verification code.',
      };
    }

    // Check expiration (10 minutes)
    if (new Date() > new Date(verification.expiresAt)) {
      return {
        success: false,
        isExpired: true,
        message: 'Verification code has expired. Please request a new code.',
      };
    }

    // Check attempts limit (5 attempts)
    if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        maxAttemptsReached: true,
        message: 'Maximum verification attempts (5) exceeded. Please request a new OTP.',
      };
    }

    const hashToCompare = verification.otpHash || verification.hashedOtp;
    if (!hashToCompare) {
      return {
        success: false,
        message: 'Verification record corrupted. Please request a new code.',
      };
    }

    const isMatch = await this.compareOtp(cleanOtp, hashToCompare);
    if (!isMatch) {
      verification.attempts = (verification.attempts || 0) + 1;
      await verification.save();

      const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - verification.attempts);
      if (remaining === 0) {
        return {
          success: false,
          maxAttemptsReached: true,
          remainingAttempts: 0,
          message: 'Maximum verification attempts (5) exceeded. Please request a new OTP.',
        };
      }

      return {
        success: false,
        remainingAttempts: remaining,
        message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    // OTP matched successfully! Update isVerified and extend expiry window to 1 hour
    // so registration form submission isn't blocked by TTL expiration
    verification.isVerified = true;
    verification.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await verification.save();

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  /**
   * Checks if an email is marked as verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({ email: normalizedEmail });
    return Boolean(verification?.isVerified);
  }

  /**
   * Deletes verification record once registration is finalized
   */
  async cleanupVerification(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await EmailVerification.deleteOne({ email: normalizedEmail }).catch(() => {});
  }
}

export const otpService = new OtpService();
export default otpService;
