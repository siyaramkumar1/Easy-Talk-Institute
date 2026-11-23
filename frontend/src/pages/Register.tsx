import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { OTPVerificationModal } from '../components/auth/OTPVerificationModal';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { token, user, authLoading, login } = useAuthStore();
  const isAuthenticated = Boolean(token) && Boolean(user);

  // Form Fields: Full Name, Mobile Number, Email Address, Password, Confirm Password
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Email Verification States
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmailAddress, setVerifiedEmailAddress] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Route protection: if already authenticated, redirect
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading || (Boolean(token) && !user)) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-900 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mobileNumber') {
      const sanitized = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      return;
    }

    if (name === 'email') {
      setFormData((prev) => ({ ...prev, email: value }));
      // If user edits email after verification, reset verified state
      if (isEmailVerified && value.trim().toLowerCase() !== verifiedEmailAddress) {
        setIsEmailVerified(false);
        setVerifiedEmailAddress('');
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * STEP 2, 3, 4, 5: Verify Email Button Click
   */
  const handleVerifyEmailClick = async () => {
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!formData.fullName.trim()) {
      setError('Please enter your Full Name before verifying email.');
      toast.error('Please enter your Full Name.');
      return;
    }

    if (!cleanEmail) {
      setError('Please enter your Email Address.');
      toast.error('Please enter your Email Address.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsSendingOtp(true);

    try {
      const response = await authService.sendVerificationOtp(cleanEmail, formData.fullName.trim());
      setShowOtpModal(true);
      toast.success(response.message || 'Verification code sent to your email.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  /**
   * STEP 8, 9: OTP Verified Callback
   */
  const handleOtpVerified = () => {
    setIsEmailVerified(true);
    setVerifiedEmailAddress(formData.email.trim().toLowerCase());
    setShowOtpModal(false);
    setError('');
  };

  /**
   * STEP 12, 13, 14, 15, 16, 17: Register Now Button Click
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailVerified) {
      setError('Please verify your email address before registering.');
      toast.error('Email verification required before registration.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password and confirm password do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.mobileNumber.length !== 10) {
      setError('Mobile Number must be 10 digits.');
      toast.error('Mobile Number must be 10 digits.');
      return;
    }

    setError('');
    setIsRegistering(true);

    try {
      const response = await authService.register({
        fullName: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.success && response.token && response.user) {
        // STEP 16: Auto Login
        login(response.user, response.token);

        // STEP 17: Show Toast & Redirect to /dashboard
        toast.success('Registration successful');
        toast.success('Welcome to Easy Talk Institute');

        navigate('/dashboard', { replace: true });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center">
          <Logo className="flex justify-center mb-6" />
          <h2 className="text-3xl font-extrabold text-blue-950">Create an Account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Start learning English with Siyaram Kumar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3.5 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                disabled={isRegistering}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
                placeholder="John Doe"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                required
                maxLength={10}
                disabled={isRegistering}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
                placeholder="9876543210"
              />
            </div>
          </div>

          {/* Email Address with Verify Email Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              {isEmailVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ✓ Email Verified
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isEmailVerified || isRegistering}
                  required
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                    isEmailVerified
                      ? 'bg-emerald-50/50 border-emerald-300 text-slate-800'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="john@example.com"
                />
                {isEmailVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailVerified(false);
                      setVerifiedEmailAddress('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 hover:text-blue-800 underline focus:outline-none"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Verify Email Button: disabled once verified */}
              <button
                type="button"
                onClick={handleVerifyEmailClick}
                disabled={isEmailVerified || isSendingOtp || isRegistering || !isValidEmail(formData.email)}
                className={`px-4 sm:px-5 py-3 rounded-xl font-medium text-sm transition-colors shrink-0 flex items-center gap-1.5 shadow-sm ${
                  isEmailVerified
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-80'
                    : 'text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isSendingOtp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : isEmailVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Email</span>
                  </>
                )}
              </button>
            </div>

            {!isEmailVerified && (
              <p className="mt-1.5 text-xs text-slate-500">
                Click <span className="font-medium text-slate-700">Verify Email</span> to receive a 6-digit OTP code in your inbox.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  disabled={isRegistering}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 disabled:bg-slate-50"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  disabled={isRegistering}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 disabled:bg-slate-50"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Register Now Button: MUST remain disabled until Email Verified = true */}
          <button
            type="submit"
            disabled={!isEmailVerified || isRegistering}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering...</span>
              </div>
            ) : (
              'Register Now'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* 6-Digit OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOtpModal}
        email={formData.email}
        fullName={formData.fullName}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}
