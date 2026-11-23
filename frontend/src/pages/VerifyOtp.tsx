import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/apiConfig';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // Email passed from Register or Login, or fallback from query params / state
  const initialEmail = location.state?.email || new URLSearchParams(location.search).get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of whole code
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (pastedDigits.length > 0) {
        const newOtp = [...otp];
        pastedDigits.forEach((digit, i) => {
          if (index + i < 6) newOtp[index + i] = digit;
        });
        setOtp(newOtp);
        const nextFocus = Math.min(index + pastedDigits.length, 5);
        inputRefs.current[nextFocus]?.focus();
        
        // Auto-verify if all 6 filled
        if (newOtp.every((d) => d !== '')) {
          submitOtp(newOtp.join(''));
        }
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Advance focus if single digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 are filled
    if (digit && index === 5 && newOtp.every((d) => d !== '')) {
      submitOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    setError('');

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      submitOtp(pastedData);
    }
  };

  const submitOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed. Please check the OTP and try again.');
      }

      setIsVerifiedSuccess(true);
      toast.success('Email verified successfully! Welcome to Easy Talk.');

      if (data.token && data.user) {
        login(data.user, data.token);
        setTimeout(() => {
          if (data.user.role === 'superadmin') {
            navigate('/superadmin/dashboard');
          } else if (data.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/student/dashboard');
          }
        }, 1200);
      } else {
        setTimeout(() => {
          navigate('/login', { state: { message: 'Email verified successfully. Please log in.' } });
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email to resend OTP.');
      return;
    }
    if (resendCooldown > 0) return;

    setError('');
    setIsResending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      toast.success(data.message || 'A new 6-digit code has been sent.');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Could not resend OTP');
      toast.error(err.message || 'Could not resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-140px)]">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
        
        {/* Header */}
        <div className="text-center">
          <Logo className="flex justify-center mb-6" />
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950">Verify Your Email</h2>
          <p className="mt-2 text-sm text-slate-600">
            We sent a 6-digit verification code to
          </p>
          {email ? (
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold max-w-full truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          ) : (
            <div className="mt-3">
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-center px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {isVerifiedSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-medium">Verification successful! Redirecting...</span>
          </div>
        )}

        {/* OTP Input Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Enter 6-Digit Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isVerifying || isVerifiedSuccess}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-xl border transition-all outline-none ${
                    digit 
                      ? 'border-blue-500 bg-blue-50/40 text-blue-900 shadow-sm' 
                      : 'border-slate-300 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              Code expires in 10 minutes
            </p>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            disabled={isVerifying || isVerifiedSuccess || otp.some((d) => d === '')}
            onClick={() => submitOtp()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend & Secondary Links */}
          <div className="pt-2 text-center space-y-4">
            <div className="text-sm text-slate-600">
              Didn't receive the email?{' '}
              {resendCooldown > 0 ? (
                <span className="font-semibold text-slate-500">
                  Resend code in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-bold text-blue-600 hover:text-blue-700 underline disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                >
                  {isResending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Resend Code
                </button>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
              <Link to="/login" className="hover:text-slate-800 transition-colors">
                &larr; Back to Login
              </Link>
              <Link to="/register" className="hover:text-slate-800 transition-colors">
                Need a new account? Register
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}




