import React, { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

interface OTPVerificationModalProps {
  isOpen: boolean;
  email: string;
  fullName?: string;
  onClose: () => void;
  onVerified: () => void;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  email,
  fullName,
  onClose,
  onVerified,
}) => {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset digits and countdown whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setOtpDigits(['', '', '', '', '', '']);
      setError('');
      setMaxAttemptsReached(false);
      setCountdown(60);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 60-second countdown for resend
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of whole 6-digit code
    if (value.length > 1) {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (cleanDigits.length > 0) {
        const nextDigits = [...otpDigits];
        cleanDigits.forEach((ch, i) => {
          if (index + i < 6) nextDigits[index + i] = ch;
        });
        setOtpDigits(nextDigits);
        const nextIndex = Math.min(index + cleanDigits.length, 5);
        inputRefs.current[nextIndex]?.focus();

        if (nextDigits.every((d) => d !== '')) {
          submitOtp(nextDigits.join(''));
        }
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);
    setError('');

    // Auto-advance focus to next digit
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (digit && index === 5 && nextDigits.every((d) => d !== '')) {
      submitOtp(nextDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...otpDigits];
    pasted.split('').forEach((ch, i) => {
      if (i < 6) nextDigits[i] = ch;
    });
    setOtpDigits(nextDigits);
    setError('');

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      submitOtp(pasted);
    }
  };

  const submitOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (maxAttemptsReached) {
      setError('Too many failed attempts. Please request a new OTP.');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      const response = await authService.verifyEmailOtp(email, code);

      if (response.success) {
        toast.success('Email verified successfully');
        onVerified();
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Incorrect verification code. Please check and try again.';
      setError(msg);
      toast.error(msg);

      if (err.response?.data?.maxAttemptsReached) {
        setMaxAttemptsReached(true);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setError('');
    setMaxAttemptsReached(false);

    try {
      const res = await authService.sendVerificationOtp(email, fullName);
      toast.success(res.message || 'New 6-digit OTP sent to your email.');
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend code';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isVerifying}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
            <Mail className="w-7 h-7 text-blue-900" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Verify Your Email</h3>
          <p className="text-sm text-slate-600 mt-1.5">
            We have sent a 6-digit code to:
          </p>
          <p className="text-sm font-semibold text-blue-900 mt-0.5 break-all">
            {email}
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs flex items-center justify-center gap-1.5 text-center">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* 6-Digit OTP Inputs */}
        <div className="flex justify-center gap-2 sm:gap-2.5 my-6" onPaste={handlePaste}>
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={isVerifying || maxAttemptsReached}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          ))}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => submitOtp()}
            disabled={isVerifying || otpDigits.some((d) => d === '') || maxAttemptsReached}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying OTP...</span>
              </>
            ) : (
              <span>Verify OTP</span>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Didn't receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="font-medium text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {isResending
                ? 'Sending OTP...'
                : countdown > 0
                ? `Resend OTP in ${countdown}s`
                : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;
