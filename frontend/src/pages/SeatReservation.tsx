import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Target, 
  Send, 
  ArrowRight,
  User,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Flame,
  Award,
  Star,
  MapPin,
  Check,
  Copy,
  ChevronDown,
  Lock,
  PhoneCall,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '../services/courseService';

export default function SeatReservation() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef<HTMLDivElement>(null);

  // Parse search params for pre-selecting course/batch
  const searchParams = new URLSearchParams(location.search);
  const paramBatchId = searchParams.get('batchId') || '';
  const paramCourse = searchParams.get('course') || '';

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [email, setEmail] = useState(user?.email || '');
  const [courseInterested, setCourseInterested] = useState(paramCourse);
  const [batchPreference, setBatchPreference] = useState('');
  const [highestQualification, setHighestQualification] = useState('');
  const [purposeOfJoining, setPurposeOfJoining] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync user details if user logs in
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name || '');
      if (!email) setEmail(user.email || '');
      if (!mobile && user.mobile) setMobile(user.mobile);
    }
  }, [user]);

  // Fetch active courses from MongoDB
  const { data: dbCourses = [] } = useQuery({
    queryKey: ['courses', 'active-for-reservation'],
    queryFn: async () => {
      const data = await courseService.getAll('Active');
      return Array.isArray(data) ? data : [];
    }
  });

  // Pre-set course or batch if batchId param exists
  useEffect(() => {
    if (paramBatchId) {
      axios.get('/api/batches')
        .then(res => {
          const batches = Array.isArray(res.data) ? res.data : [];
          const found = batches.find((b: any) => b._id === paramBatchId);
          if (found) {
            if (found.courseName && !courseInterested) {
              setCourseInterested(found.courseName);
            } else if (found.course?.title && !courseInterested) {
              setCourseInterested(found.course.title);
            }
            if (!batchPreference) {
              setBatchPreference('Morning Batch');
            }
          }
        })
        .catch(() => {});
    }
  }, [paramBatchId]);

  // Dropdown options specified in prompt
  const standardCourses = [
    'English Speaking Course',
    'Interview Preparation',
    'Communication Skills',
    'Personality Development'
  ];

  // Merge standard options with dynamic database courses
  const allCourseOptions = Array.from(new Set([
    ...standardCourses,
    ...dbCourses.map((c: any) => c.title || c.name).filter(Boolean)
  ]));

  const batchOptions = [
    'Morning Batch',
    'Afternoon Batch',
    'Evening Batch',
    'Weekend Batch'
  ];

  const qualificationOptions = [
    'Matriculation',
    'Intermediate',
    'Graduation',
    'Post Graduation',
    'Other'
  ];

  const purposeOptions = [
    'Improve Spoken English',
    'Job Interview Preparation',
    'Personality Development',
    'Career Growth',
    'Study Abroad',
    'Other'
  ];

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Full Name must be at least 2 characters.';
    }

    const cleanMobile = mobile.trim();
    if (!cleanMobile) {
      errors.mobile = 'Mobile Number is required.';
    } else if (!/^\d{10}$/.test(cleanMobile)) {
      errors.mobile = 'Please enter a valid 10-digit mobile number.';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!courseInterested.trim()) {
      errors.courseInterested = 'Please select a course.';
    }

    if (!batchPreference) {
      errors.batchPreference = 'Please select your batch preference.';
    }

    if (!highestQualification) {
      errors.highestQualification = 'Please select your highest qualification.';
    }

    if (!purposeOfJoining) {
      errors.purposeOfJoining = 'Please select your purpose of joining.';
    }

    if (message.length > 500) {
      errors.message = 'Message cannot exceed 500 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const payload = {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        courseInterested: courseInterested.trim(),
        batchPreference,
        highestQualification,
        purposeOfJoining,
        message: message.trim(),
      };

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post('/api/reservations', payload, { headers });
      const refCode = res.data?.referenceId || `ETI-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      setReferenceId(refCode);

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      toast.success('Seat reservation submitted successfully!', {
        duration: 5000,
        style: {
          borderRadius: '16px',
          background: '#16a34a',
          color: '#ffffff',
          fontWeight: 600,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }
      });
    } catch (err: any) {
      console.error('Seat reservation error:', err);
      toast.error('Failed to submit reservation. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReference = () => {
    if (referenceId) {
      navigator.clipboard.writeText(referenceId);
      setCopied(true);
      toast.success('Reference ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // SUCCESS SCREEN
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-[480px] md:max-w-xl mx-auto">
          
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-sm animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Confirmed Priority Seat</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Seat Reservation Submitted Successfully
            </h1>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Thank you for choosing <strong>Easy Talk Institute</strong>. Our academic counseling team will contact you within <strong>24 hours</strong> on your registered mobile number.
            </p>

            {/* Reference ID Box */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 mb-6 shadow-md text-left relative">
              <p className="text-xs uppercase font-bold tracking-wider text-blue-200 mb-1">
                Official Reference ID
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-amber-300">
                  {referenceId || 'ETI-2026-84920'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-2 font-light">
                Please quote this reference number during your admission counseling call.
              </p>
            </div>

            {/* Reservation Summary */}
            <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100 text-left mb-6 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Candidate Name:</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Contact Number:</span>
                <span className="font-bold text-slate-900">+91 {mobile}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Course Selected:</span>
                <span className="font-bold text-blue-900">{courseInterested}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Batch Preference:</span>
                <span className="font-semibold text-slate-800">{batchPreference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Qualification:</span>
                <span className="font-semibold text-slate-800">{highestQualification}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <a
                href="tel:+919431885389"
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Now</span>
              </a>
              <a
                href={`https://wa.me/919431885389?text=${encodeURIComponent(`Hello Easy Talk Institute, I have reserved a seat (Ref: ${referenceId}). Please share course details.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Secondary Links */}
            <div className="flex items-center gap-3">
              <Link
                to="/courses"
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors text-center"
              >
                Explore Courses
              </Link>
              <Link
                to="/"
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 sm:pb-16 pt-4 sm:pt-8 text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      
      {/* Container: Max width 480px on mobile, responsive for tablet/desktop */}
      <div className="w-full max-w-[480px] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* ========================================================= */}
        {/* 1. HEADER SECTION WITH LOGO & TRUST BADGES                */}
        {/* ========================================================= */}
        <header className="text-center mb-6 sm:mb-8">
          {/* Logo & Institute Branding */}
          <div className="inline-flex items-center justify-center gap-2.5 mb-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-900 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
              ET
            </div>
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight leading-none">
                Easy Talk Institute
              </h2>
              <p className="text-[11px] sm:text-xs font-semibold text-orange-600 mt-0.5">
                Premier Spoken English & Placement Platform
              </p>
            </div>
          </div>

          {/* Hindi Tagline */}
          <p className="text-sm sm:text-base font-bold text-slate-700 mb-3.5">
            अंग्रेजी बोलना सीखें, बिल्कुल Basic से Advanced तक
          </p>

          {/* 4 Trust Badges (Scrollable on small mobile, flex on desktop) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {[
              '✓ Live Interactive Classes',
              '✓ Placement Preparation',
              '✓ Expert Trainers',
              '✓ Limited Seats Available'
            ].map((badge, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-100 shadow-2xs"
              >
                {badge}
              </span>
            ))}
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. PREMIUM HERO CARD (GRADIENT & HIGHLIGHT STATS)         */}
        {/* ========================================================= */}
        <section className="mb-6 sm:mb-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl border border-blue-900/60">
            {/* Subtle glow shapes */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold mb-3 border border-white/10">
                <span>🎯</span>
                <span>Limited Seats Per Cohort</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2 leading-tight">
                Reserve Your Seat Today
              </h1>

              <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed mb-5 max-w-xl font-normal">
                Book your priority admission seat in our live spoken English & placement batches. Our academic counselors will contact you within 24 hours.
              </p>

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/15 text-center">
                <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                  <span className="block text-base sm:text-lg font-black text-orange-400">🔥</span>
                  <span className="block text-[10px] sm:text-xs font-bold text-white mt-0.5 leading-tight">
                    Seats Filling Fast
                  </span>
                </div>

                <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                  <span className="block text-base sm:text-lg font-black text-amber-300">👨‍🎓</span>
                  <span className="block text-[10px] sm:text-xs font-bold text-white mt-0.5 leading-tight">
                    500+ Trained
                  </span>
                </div>

                <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                  <span className="block text-base sm:text-lg font-black text-amber-300">⭐ 4.9</span>
                  <span className="block text-[10px] sm:text-xs font-bold text-white mt-0.5 leading-tight">
                    Rated by Students
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. FORM CARD DESIGN (52px MIN HEIGHT, ICONS, VALIDATION)   */}
        {/* ========================================================= */}
        <section ref={formRef} id="reservation-form" className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-5 sm:p-8 md:p-10 relative">
            
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>📝</span>
                <span>Seat Reservation Form</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the required details below to confirm priority seat counseling.
              </p>
            </div>

            <form onSubmit={handleReserve} className="space-y-4 sm:space-y-5" noValidate>
              
              {/* Field 1: Full Name * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    inputMode="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' });
                    }}
                    placeholder="Enter your full name"
                    className={`w-full min-h-[52px] h-[52px] pl-11 pr-4 rounded-xl border text-sm sm:text-base font-medium transition-all focus:outline-none ${
                      fieldErrors.fullName
                        ? 'border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Field 2: Mobile Number * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="ml-1.5 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2">
                      +91
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setMobile(val);
                      if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: '' });
                    }}
                    placeholder="10-digit mobile number"
                    className={`w-full min-h-[52px] h-[52px] pl-20 pr-4 rounded-xl border text-sm sm:text-base font-medium tracking-wide transition-all focus:outline-none ${
                      fieldErrors.mobile
                        ? 'border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.mobile && (
                  <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.mobile}
                  </p>
                )}
              </div>

              {/* Field 3: Email Address (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 lowercase">(optional)</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    placeholder="name@example.com"
                    className={`w-full min-h-[52px] h-[52px] pl-11 pr-4 rounded-xl border text-sm sm:text-base font-medium transition-all focus:outline-none ${
                      fieldErrors.email
                        ? 'border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Field 4: Course Interested In * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Course Interested In <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <select
                    value={courseInterested}
                    onChange={(e) => {
                      setCourseInterested(e.target.value);
                      if (fieldErrors.courseInterested) setFieldErrors({ ...fieldErrors, courseInterested: '' });
                    }}
                    className={`w-full min-h-[52px] h-[52px] pl-11 pr-10 rounded-xl border text-sm sm:text-base font-medium bg-white transition-all focus:outline-none appearance-none cursor-pointer ${
                      fieldErrors.courseInterested
                        ? 'border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    required
                  >
                    <option value="">Select Course Program</option>
                    {allCourseOptions.map((courseName, idx) => (
                      <option key={idx} value={courseName}>
                        {courseName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
                {fieldErrors.courseInterested && (
                  <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.courseInterested}
                  </p>
                )}
              </div>

              {/* Field 5: Batch Preference * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Batch Preference <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <select
                    value={batchPreference}
                    onChange={(e) => {
                      setBatchPreference(e.target.value);
                      if (fieldErrors.batchPreference) setFieldErrors({ ...fieldErrors, batchPreference: '' });
                    }}
                    className={`w-full min-h-[52px] h-[52px] pl-11 pr-10 rounded-xl border text-sm sm:text-base font-medium bg-white transition-all focus:outline-none appearance-none cursor-pointer ${
                      fieldErrors.batchPreference
                        ? 'border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    required
                  >
                    <option value="">Select Preferred Timing</option>
                    {batchOptions.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
                {fieldErrors.batchPreference && (
                  <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.batchPreference}
                  </p>
                )}
              </div>

              {/* Field 6: Highest Qualification * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Highest Qualification <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <select
                    value={highestQualification}
                    onChange={(e) => {
                      setHighestQualification(e.target.value);
                      if (fieldErrors.highestQualification) setFieldErrors({ ...fieldErrors, highestQualification: '' });
                    }}
                    className={`w-full min-h-[52px] h-[52px] pl-11 pr-10 rounded-xl border text-sm sm:text-base font-medium bg-white transition-all focus:outline-none appearance-none cursor-pointer ${
                      fieldErrors.highestQualification
                        ? 'border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    required
                  >
                    <option value="">Select Qualification</option>
                    {qualificationOptions.map((q, idx) => (
                      <option key={idx} value={q}>{q}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
                {fieldErrors.highestQualification && (
                  <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.highestQualification}
                  </p>
                )}
              </div>

              {/* Field 7: Purpose of Joining * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Purpose of Joining <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <select
                    value={purposeOfJoining}
                    onChange={(e) => {
                      setPurposeOfJoining(e.target.value);
                      if (fieldErrors.purposeOfJoining) setFieldErrors({ ...fieldErrors, purposeOfJoining: '' });
                    }}
                    className={`w-full min-h-[52px] h-[52px] pl-11 pr-10 rounded-xl border text-sm sm:text-base font-medium bg-white transition-all focus:outline-none appearance-none cursor-pointer ${
                      fieldErrors.purposeOfJoining
                        ? 'border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    required
                  >
                    <option value="">Select Your Goal</option>
                    {purposeOptions.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
                {fieldErrors.purposeOfJoining && (
                  <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.purposeOfJoining}
                  </p>
                )}
              </div>

              {/* Field 8: Message (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Message
                  </label>
                  <span className={`text-[11px] font-mono ${message.length > 500 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {message.length}/500
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute top-3.5 left-3.5 pointer-events-none text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: '' });
                    }}
                    placeholder="Tell us about your learning goals or questions for our counselor..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-sm sm:text-base font-medium transition-all focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Professional Information Box */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-950">
                    🔒 Your information is completely secure.
                  </p>
                  <p className="text-blue-800/90 mt-0.5">
                    We only use your details for admission counseling and course-related communication.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[54px] bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-orange-700 active:scale-[0.99] text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reserving Your Seat...</span>
                    </>
                  ) : (
                    <>
                      <span>Reserve Seat Now</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. INSTITUTE CONTACT CARD & QUICK ACTION BUTTONS          */}
        {/* ========================================================= */}
        <section className="mb-8">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-md">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-2xl">🏫</span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Easy Talk Institute
                </h3>
                <p className="text-xs text-slate-500">Official Learning & Counseling Center</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 mb-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="font-medium text-slate-700 leading-snug">
                  📍 प्राचीन देवी मंदिर के ठीक बगल में, 2nd Floor, PG Road, Jehanabad, Bihar
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <a href="tel:+919431885389" className="font-bold text-blue-900 hover:underline">
                  📞 +91 9431885389
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href="mailto:siyaramkumar103@gmail.com" className="font-medium text-slate-700 hover:text-blue-900 truncate">
                  ✉️ siyaramkumar103@gmail.com
                </a>
              </div>
            </div>

            {/* 2 Equal-Width Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:+919431885389"
                className="min-h-[48px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Now</span>
              </a>

              <a
                href="https://wa.me/919431885389?text=Hello%20Easy%20Talk%20Institute%2C%20I%20want%20to%20reserve%20a%20seat%20for%20the%20English%20batch."
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. TRUST SECTION: WHY STUDENTS CHOOSE EASY TALK           */}
        {/* ========================================================= */}
        <section className="mb-10">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900">
            <h3 className="text-lg sm:text-xl font-black text-center mb-6 tracking-tight text-amber-300">
              Why Students Choose Easy Talk
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold">
              {[
                '✓ Expert English Trainers',
                '✓ Live Interactive Sessions',
                '✓ Placement Focused Training',
                '✓ Practical Speaking Practice',
                '✓ Small Batch Size',
                '✓ Personal Guidance'
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                    ✓
                  </span>
                  <span>{item.replace('✓ ', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. FOOTER SECTION                                         */}
        {/* ========================================================= */}
        <footer className="text-center text-xs text-slate-500 space-y-2 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <Link to="/about" className="hover:text-blue-900 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-blue-900 transition-colors">Terms of Service</Link>
          </div>
          <p className="font-bold text-slate-700">
            © 2026 Easy Talk Institute
          </p>
          <p className="text-slate-400 text-[11px]">
            Transforming careers through effective communication.
          </p>
        </footer>

      </div>

      {/* ========================================================= */}
      {/* 7. MOBILE STICKY FOOTER CTA (ALWAYS VISIBLE ON MOBILE)    */}
      {/* ========================================================= */}
      <aside 
        aria-label="Quick Assistance and Reservation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-2.5 sm:hidden shadow-2xl flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <a
            href="tel:+919431885389"
            aria-label="Call Easy Talk Institute"
            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold active:scale-95 transition-transform"
          >
            <PhoneCall className="w-4 h-4" />
          </a>

          <a
            href="https://wa.me/919431885389?text=Hello%20Easy%20Talk%20Institute%2C%20I%20want%20to%20reserve%20a%20seat."
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold active:scale-95 transition-transform"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>

        <button
          onClick={scrollToForm}
          className="flex-1 min-h-[42px] px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <span>Reserve Seat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </aside>

    </div>
  );
}
