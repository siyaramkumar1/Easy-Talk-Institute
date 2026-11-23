import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, X, RefreshCw, CheckCircle2, KeyRound } from 'lucide-react';
import Logo from '../components/layout/Logo';
import toast from 'react-hot-toast';

const REMEMBERED_EMAIL_KEY = 'et_remembered_email';
const REMEMBER_ME_PREF_KEY = 'et_remember_me';

const getSavedRememberedEmail = (): { email: string; rememberMe: boolean } => {
  try {
    const isRemembered = localStorage.getItem(REMEMBER_ME_PREF_KEY) === 'true';
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
    if (isRemembered && savedEmail.trim()) {
      return { email: savedEmail.trim(), rememberMe: true };
    }
  } catch {
    // Ignore storage access errors
  }
  return { email: '', rememberMe: false };
};

export default function Login() {
  const savedPreference = getSavedRememberedEmail();
  const [email, setEmail] = useState(savedPreference.email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(savedPreference.rememberMe);
  
  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  
  const { token, user, authLoading, login } = useAuthStore();
  const isAuthenticated = Boolean(token) && Boolean(user);

  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(location.state?.message || '');
  const [isLoading, setIsLoading] = useState(false);

  // Route protection: if already authenticated, redirect based on role
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
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

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      try {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        localStorage.removeItem(REMEMBER_ME_PREF_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email, password, rememberMe })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.isUnverified) {
          navigate('/verify-otp', { 
            state: { 
              email,
            } 
          });
          return;
        }
        throw new Error(data.message || data.error || 'Login failed');
      }

      // Persist ONLY the remembered email preference (never password or auth token)
      try {
        if (rememberMe && email.trim()) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
          localStorage.setItem(REMEMBER_ME_PREF_KEY, 'true');
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          localStorage.removeItem(REMEMBER_ME_PREF_KEY);
        }
      } catch {
        // Ignore storage errors
      }
      
      login(data.user, data.token);
      
      const from = location.state?.from;
      if (from) {
        navigate(from, { replace: true, state: location.state });
      } else if (data.user.role === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center">
          <Logo className="flex justify-center mb-6" />
          <h2 className="text-3xl font-extrabold text-blue-950">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-600">
            Log in to continue your learning journey
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                  placeholder="Enter your password"
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
          </div>

          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="remember-me"
              className="inline-flex items-center gap-2.5 py-1 text-sm text-slate-700 cursor-pointer select-none touch-manipulation"
            >
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => handleRememberMeChange(e.target.checked)}
                className="h-4 w-4 accent-orange-500 text-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 border-slate-300 rounded cursor-pointer touch-manipulation"
              />
              <span className="font-medium text-slate-700">Remember Me</span>
            </label>
            <div className="text-sm shrink-0">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email || '');
                  setForgotStep('email');
                  setForgotError('');
                  setShowForgotModal(true);
                }}
                className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer py-1 touch-manipulation"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="text-center mt-4">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Register Now
            </Link>
          </p>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 relative">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {forgotStep === 'email'
                    ? 'Enter your registered email to receive a 6-digit verification code.'
                    : `Enter the 6-digit code sent to ${forgotEmail} and your new password.`}
                </p>
              </div>

              {forgotError && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs">
                  {forgotError}
                </div>
              )}

              {forgotStep === 'email' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!forgotEmail.trim()) {
                      setForgotError('Please enter your email address.');
                      return;
                    }
                    setForgotError('');
                    setForgotLoading(true);
                    try {
                      const res = await fetch('/api/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: forgotEmail.trim() }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message || 'Failed to request reset OTP');
                      toast.success(data.message || 'Reset code sent to your email.');
                      setForgotStep('reset');
                    } catch (err: any) {
                      setForgotError(err.message || 'Error sending reset code');
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send 6-Digit Code'}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (forgotOtp.length !== 6) {
                      setForgotError('Please enter all 6 digits of the OTP.');
                      return;
                    }
                    if (newPassword.length < 8) {
                      setForgotError('New password must be at least 8 characters.');
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setForgotError('Passwords do not match.');
                      return;
                    }
                    setForgotError('');
                    setForgotLoading(true);
                    try {
                      const res = await fetch('/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: forgotEmail.trim(),
                          otp: forgotOtp.trim(),
                          newPassword,
                          confirmPassword: confirmNewPassword,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message || 'Password reset failed');
                      toast.success('Password reset successful! Please sign in.');
                      setShowForgotModal(false);
                    } catch (err: any) {
                      setForgotError(err.message || 'Error resetting password');
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-center font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min 8 chars)</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Set New Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
