import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Camera, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Save, 
  Edit3, 
  X, 
  Lock, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  BookOpen, 
  Bell, 
  Settings as SettingsIcon, 
  LayoutDashboard,
  User as UserIcon,
  XCircle
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function Profile() {
  const { user, checkAuth } = useAuthStore();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const profileId = searchParams.get('id'); // Allows admin to view other profiles

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '' });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  
  // For password change
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = profileId ? `/api/users/${profileId}` : '/api/users/profile';
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(res.data);
      setFormData({ name: res.data.name || '', mobile: res.data.mobile || '', email: res.data.email || '' });
      setPhotoPreview(res.data.avatar || null);
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = new FormData();
      updateData.append('name', formData.name);
      updateData.append('mobile', formData.mobile);
      if (photoFile) updateData.append('avatar', photoFile);

      const url = profileId ? `/api/users/${profileId}` : '/api/users/profile';
      await axios.put(url, updateData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Profile Updated Successfully');
      setIsEditing(false);
      setPhotoFile(null);
      fetchProfile();
      if (!profileId) checkAuth();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwords.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/update-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password Updated Successfully');
      setIsChangingPassword(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Helper to extract initials like "SK" for "Siyaram Kumar"
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper to format joined date like "Joined September 2026"
  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return 'Joined September 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Joined September 2026';
    const month = d.toLocaleString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `Joined ${month} ${year}`;
  };

  // Format role label
  const formatRole = (role?: string) => {
    if (!role) return 'User';
    if (role.toLowerCase() === 'superadmin') return 'Super Admin';
    if (role.toLowerCase() === 'admin') return 'Admin';
    if (role.toLowerCase() === 'student') return 'Student';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center text-slate-500">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Loading your profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm text-red-600">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">Profile Not Found</h2>
        <p className="text-sm text-slate-500 mb-4">We were unable to locate this profile information.</p>
        <button 
          onClick={fetchProfile}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const isOwnProfile = !profileId || profileId === user?.id || profileId === user?._id;
  const initials = getInitials(profileData.name);
  const isActiveStatus = (profileData.status || 'Active').toLowerCase() === 'active';
  const roleDisplay = formatRole(profileData.role);

  return (
    <div className="w-full max-w-2xl mx-auto px-1 sm:px-4">

      {/* ========================================================= */}
      {/* 1. PROFILE HEADER CARD                                    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 p-6 mt-6 mb-5 text-center transition-all">
        
        {/* Large User Avatar (80px - 100px) */}
        <div className="relative mx-auto w-24 h-24 sm:w-24 sm:h-24">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 border-4 border-white shadow-md flex items-center justify-center text-white text-3xl font-bold tracking-wider select-none">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt={profileData.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Camera upload badge during editing */}
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-colors border-2 border-white">
              <Camera className="w-4 h-4" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPhotoFile(e.target.files[0]);
                    setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }} 
              />
            </label>
          )}
        </div>

        {/* User Full Name */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-4 break-words">
          {profileData.name}
        </h1>

        {/* User Status Badge & Role Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {isActiveStatus ? 'Active User' : 'Inactive User'}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            👤 {roleDisplay}
          </span>
        </div>

        {/* Contact & Meta Information */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-sm text-slate-600">
          <div className="flex items-center justify-center gap-2 text-slate-700 max-w-full break-all">
            <span className="text-base">✉️</span>
            <span className="font-medium">{profileData.email}</span>
          </div>

          {profileData.mobile && (
            <div className="flex items-center justify-center gap-2 text-slate-700">
              <span className="text-base">📱</span>
              <span className="font-medium">{profileData.mobile}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs sm:text-sm">
            <span className="text-base">📅</span>
            <span>{formatJoinedDate(profileData.createdAt)}</span>
          </div>
        </div>

        {/* Premium Edit Profile Button */}
        {isOwnProfile && !isEditing && (
          <div className="mt-5">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-50 hover:bg-blue-100/80 active:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl border border-blue-200/80 shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* EDIT PROFILE FORM (Expands when Edit Profile is clicked)  */}
      {/* ========================================================= */}
      {isEditing && (
        <form 
          onSubmit={handleUpdateProfile}
          className="bg-white rounded-[16px] shadow-sm border border-blue-200/80 p-5 sm:p-6 mb-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              <span>Edit Profile Details</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setPhotoFile(null);
                setPhotoPreview(profileData.avatar || null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1.5">
                Full Name
              </label>
              <input 
                required 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                className="w-full px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 transition-all"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1.5">
                Mobile Number
              </label>
              <input 
                type="tel" 
                value={formData.mobile} 
                onChange={e => setFormData({ ...formData, mobile: e.target.value })} 
                className="w-full px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 transition-all"
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1.5">
                Email Address (Cannot be changed)
              </label>
              <input 
                type="email" 
                value={formData.email} 
                disabled 
                className="w-full px-4 py-2.5 text-sm border border-slate-200 bg-slate-100/70 text-slate-500 rounded-xl cursor-not-allowed select-none font-medium" 
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setPhotoFile(null);
                setPhotoPreview(profileData.avatar || null);
              }} 
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmittingProfile}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> 
              <span>{isSubmittingProfile ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* 2. ACCOUNT INFORMATION SECTION                            */}
      {/* ========================================================= */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200/80 p-5 sm:p-6 mb-5 transition-all">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
          Account Information
        </h2>

        <div className="divide-y divide-slate-100">
          
          {/* Row 1: Email Address */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">✉️</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Email Address
              </span>
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-900 break-all text-left sm:text-right pl-6 sm:pl-0">
              {profileData.email}
            </span>
          </div>

          {/* Row 2: Mobile Number */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">📱</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Mobile Number
              </span>
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-900 text-left sm:text-right pl-6 sm:pl-0">
              {profileData.mobile || 'Not provided'}
            </span>
          </div>

          {/* Row 3: Account Type */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">👤</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Account Type
              </span>
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-900 text-left sm:text-right pl-6 sm:pl-0">
              {roleDisplay}
            </span>
          </div>

          {/* Row 4: Status */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">🟢</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Status
              </span>
            </div>
            <span className="text-sm sm:text-base font-semibold text-emerald-700 text-left sm:text-right pl-6 sm:pl-0 flex items-center gap-1.5 sm:justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {profileData.status || 'Active'}
            </span>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SECURITY SECTION                                       */}
      {/* ========================================================= */}
      {isOwnProfile && !profileId && (
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200/80 p-5 sm:p-6 mb-5 transition-all">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
            Security Settings
          </h2>

          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl mb-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-sm sm:text-base">
              <span className="text-lg select-none">🔒</span>
              <span>Password Protection</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 pl-7 leading-relaxed">
              Keep your account secure by regularly updating your password.
            </p>
          </div>

          {!isChangingPassword ? (
            <button
              onClick={() => {
                setIsChangingPassword(true);
                setPasswordError('');
              }}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-semibold text-sm shadow-xs transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 animate-in fade-in duration-200">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs sm:text-sm rounded-xl border border-red-200 flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Current Password
                </label>
                <input 
                  required 
                  type="password" 
                  value={passwords.currentPassword} 
                  onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} 
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 transition-all"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  New Password
                </label>
                <input 
                  required 
                  type="password" 
                  minLength={8} 
                  value={passwords.newPassword} 
                  onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} 
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 transition-all"
                  placeholder="Minimum 8 characters"
                />
                <p className="text-[11px] text-slate-400 mt-1">Must be at least 8 characters long</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Confirm New Password
                </label>
                <input 
                  required 
                  type="password" 
                  minLength={8} 
                  value={passwords.confirmPassword} 
                  onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} 
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 transition-all"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordError('');
                    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }} 
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingPassword}
                  className="h-11 px-6 bg-slate-900 hover:bg-black active:bg-slate-950 disabled:opacity-70 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmittingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. QUICK ACTIONS SECTION                                  */}
      {/* ========================================================= */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200/80 p-5 sm:p-6 mb-8 transition-all">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
          Quick Actions
        </h2>

        <div className="flex flex-col gap-3">
          
          {/* Button 1: My Courses */}
          <Link
            to="/student/courses"
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl select-none">📚</span>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  My Courses
                </p>
                <p className="text-xs text-slate-500">
                  Access your enrolled classes & curriculum
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Button 2: Notifications */}
          <Link
            to="/user/notifications"
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl select-none">🔔</span>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Stay updated with notices & institute announcements
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Button 3: Settings */}
          <Link
            to="/student/settings"
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl select-none">⚙️</span>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Settings
                </p>
                <p className="text-xs text-slate-500">
                  Manage preferences & application options
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Button 4: Dashboard */}
          <Link
            to="/student/dashboard"
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl select-none">📊</span>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Dashboard
                </p>
                <p className="text-xs text-slate-500">
                  View overview, progress & batch schedules
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

        </div>
      </div>

    </div>
  );
}
