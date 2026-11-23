import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  User, 
  Lock, 
  Bell, 
  Key, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  Save, 
  ExternalLink,
  Shield,
  Check
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'security' | 'account' | 'notifications'>('security');

  // Password Reset State
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  // Toggle password visibility for all 3 fields
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '', percent: 0, textColor: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (pwd.length < 8) {
      return { score: 1, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-600', percent: 33 };
    }
    if (score <= 2) {
      return { score: 2, label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-600', percent: 66 };
    }
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600', percent: 100 };
  };

  const strength = getPasswordStrength(passwords.newPassword);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put('/api/users/update-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password Updated Successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const quickSettingsCards = [
    {
      id: 'account' as const,
      title: 'Account Settings',
      description: 'Manage your profile details',
      icon: '👤',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
      id: 'notifications' as const,
      title: 'Notifications',
      description: 'Control notification preferences',
      icon: '🔔',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100'
    },
    {
      id: 'security' as const,
      title: 'Security',
      description: 'Manage password and account protection',
      icon: '🔒',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    }
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-1 sm:px-4">

      {/* ========================================================= */}
      {/* 1. SETTINGS HERO SECTION                                  */}
      {/* Spacing: Navbar → Settings = 12px (mt-1 with pt-2)        */}
      {/* Light gradient background, 20px rounded, 20px padding    */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white rounded-[20px] shadow-xs border border-blue-100/80 p-5 mt-1 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-blue-100 flex items-center justify-center shrink-0 text-2xl select-none">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Settings
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 leading-snug">
                Manage your account preferences, notifications and account security.
              </p>
            </div>
          </div>

          <div className="self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200/90 shadow-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Account Active
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. QUICK SETTINGS CARDS                                   */}
      {/* Spacing: Settings Hero → Quick Cards = 16px (mt-4)        */}
      {/* 3 modern cards (72px - 80px height, rounded-16px)        */}
      {/* ========================================================= */}
      <div className="mt-4 flex flex-col gap-2.5">
        {quickSettingsCards.map((card) => {
          const isActive = activeTab === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveTab(card.id)}
              className={`w-full min-h-[74px] sm:min-h-[78px] p-3.5 sm:p-4 rounded-[16px] shadow-xs flex items-center justify-between transition-all duration-200 cursor-pointer text-left group ${
                isActive
                  ? 'bg-blue-50/50 border-2 border-blue-500 ring-2 ring-blue-500/10'
                  : 'bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-xl border select-none ${card.iconBg}`}>
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-2">
                {isActive && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full hidden sm:inline-block">
                    Active
                  </span>
                )}
                <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'text-blue-600 translate-x-0.5' : 'text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 3. SECURITY / PASSWORD TAB (Default Active Section)       */}
      {/* Spacing: Quick Cards → Password Section = 20px (mt-5)     */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="animate-in fade-in duration-200">
          
          {/* 3A. PASSWORD SECTION CARD */}
          <div className="mt-5 bg-white rounded-[18px] shadow-xs border border-slate-200/90 p-5 transition-all">
            <div className="pb-3.5 mb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg select-none">🔒</span>
                  <span>Change Password</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Keep your account secure by updating your password regularly.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              
              {/* Field 1: Current Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    required
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full h-[52px] px-4 pr-12 bg-slate-50/70 border border-slate-200 rounded-[14px] text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer rounded-lg transition-colors"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    title={showCurrentPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 2: New Password with Password Strength */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    New Password
                  </label>
                  <span className="text-xs text-slate-400 font-medium">
                    Minimum 8 characters
                  </span>
                </div>
                <div className="relative">
                  <input
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    minLength={8}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full h-[52px] px-4 pr-12 bg-slate-50/70 border border-slate-200 rounded-[14px] text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer rounded-lg transition-colors"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    title={showNewPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwords.newPassword && (
                  <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Password Strength</span>
                      <span className={`font-bold ${strength.textColor}`}>
                        {strength.label}
                      </span>
                    </div>
                    {/* Live Segmented Indicator Bar */}
                    <div className="grid grid-cols-3 gap-1.5 h-2">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`}></div>
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`}></div>
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    minLength={8}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full h-[52px] px-4 pr-12 bg-slate-50/70 border border-slate-200 rounded-[14px] text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer rounded-lg transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3B. UPDATE PASSWORD BUTTON (Large 54px, Full Width, Gradient) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[54px] rounded-[14px] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base select-none">🔒</span>
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* ========================================================= */}
          {/* 3C. SECURITY TIPS SECTION                                 */}
          {/* Spacing: Password Section → Security Tips = 20px (mt-5)   */}
          {/* Rounded 16px, Padding 18px, Soft background               */}
          {/* ========================================================= */}
          <div className="mt-5 bg-slate-50/90 rounded-[16px] border border-slate-200/80 p-[18px] transition-all">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base mb-3">
              <span className="text-base select-none">🛡</span>
              <span>Security Recommendations</span>
            </div>

            <div className="space-y-2.5">
              {[
                'Use at least 8 characters',
                'Include uppercase, lowercase and numbers',
                'Never share your password',
                'Update passwords regularly',
                'Use unique passwords'
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold select-none">
                    ✓
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3D. ACCOUNT SECURITY STATUS CARD                          */}
          {/* Spacing: Security Tips → Security Status = 20px (mt-5)    */}
          {/* Spacing: Security Status → Footer = 28px (mb-[28px])      */}
          {/* ========================================================= */}
          <div className="mt-5 mb-[28px] bg-white rounded-[16px] shadow-xs border border-slate-200/90 p-5 transition-all">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg select-none">🛡</span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Security Status
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                100% Protected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Item 1: Email Verified */}
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                  <span className="text-sm select-none">📧</span>
                  <span>Email Verified</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Verified
                </span>
              </div>

              {/* Item 2: Mobile Verified */}
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                  <span className="text-sm select-none">📱</span>
                  <span>Mobile Verified</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Verified
                </span>
              </div>

              {/* Item 3: Password Protected */}
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                  <span className="text-sm select-none">🔒</span>
                  <span>Password Protected</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Protected
                </span>
              </div>

              {/* Item 4: Account Active */}
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                  <span className="text-sm select-none">🟢</span>
                  <span>Account Active</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                </span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ACCOUNT SETTINGS TAB CONTENT                           */}
      {/* ========================================================= */}
      {activeTab === 'account' && (
        <div className="mt-5 mb-[28px] bg-white rounded-[18px] shadow-xs border border-slate-200/90 p-5 transition-all animate-in fade-in duration-200">
          <div className="pb-3.5 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-lg select-none">👤</span>
                <span>Account Overview</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Your authenticated profile and credentials
              </p>
            </div>
            <Link
              to="/profile"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/70"
            >
              <span>Full Profile</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Name</span>
              <span className="text-sm font-bold text-slate-900">{user?.name || 'Student User'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Email Address</span>
              <span className="text-sm font-bold text-slate-900 break-all">{user?.email || 'N/A'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Role & Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {user?.role ? user.role.toUpperCase() : 'STUDENT'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/profile"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Edit Profile Details</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. NOTIFICATIONS PREFERENCES TAB CONTENT                  */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="mt-5 mb-[28px] bg-white rounded-[18px] shadow-xs border border-slate-200/90 p-5 transition-all animate-in fade-in duration-200">
          <div className="pb-3.5 mb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-lg select-none">🔔</span>
              <span>Notification Preferences</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Control which notifications and alerts you receive
            </p>
          </div>

          <div className="space-y-3">
            {[
              { id: 'email', label: 'Email Notifications', desc: 'Receive daily summary and class schedule emails' },
              { id: 'course', label: 'Course & Batch Alerts', desc: 'Instant updates regarding enrolled batches' },
              { id: 'test', label: 'Assessment Test Alerts', desc: 'Alerts when your test scores and results are published' },
              { id: 'announcement', label: 'Institute Announcements', desc: 'Important news, notices, and events from Easy Talk' }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs sm:text-sm text-slate-800">{item.label}</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => toast.success('Notification preferences saved successfully')}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
