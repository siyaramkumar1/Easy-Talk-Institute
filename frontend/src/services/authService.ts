import axios from 'axios';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  email?: string;
  cooldownRemaining?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  remainingAttempts?: number;
  maxAttemptsReached?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
}

export const authService = {
  /**
   * Request 6-digit verification OTP sent via Gmail SMTP
   */
  async sendVerificationOtp(email: string, fullName?: string): Promise<SendOtpResponse> {
    const res = await axios.post('/api/auth/send-verification-otp', {
      email: email.trim().toLowerCase(),
      fullName: fullName?.trim() || '',
      name: fullName?.trim() || '',
    });
    return res.data;
  },

  /**
   * Verify the 6-digit OTP code with bcrypt backend checking
   */
  async verifyEmailOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
    const res = await axios.post('/api/auth/verify-email-otp', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });
    return res.data;
  },

  /**
   * Check if email is currently verified in the backend session
   */
  async checkVerification(email: string): Promise<boolean> {
    const res = await axios.get('/api/auth/check-verification', {
      params: { email: email.trim().toLowerCase() },
    });
    return Boolean(res.data?.verified);
  },

  /**
   * Complete student registration after email is verified
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await axios.post('/api/auth/register', {
      fullName: payload.fullName.trim(),
      name: payload.fullName.trim(),
      mobileNumber: payload.mobileNumber.trim(),
      mobile: payload.mobileNumber.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      confirmPassword: payload.confirmPassword || payload.password,
    });
    return res.data;
  },
};

export default authService;
