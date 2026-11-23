import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  Sparkles, 
  ChevronDown, 
  ArrowRight, 
  Award, 
  GraduationCap, 
  Download, 
  Send, 
  Check, 
  ExternalLink,
  Layers,
  IndianRupee,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Enrollment() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();

  // Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch course details if courseId is provided
  const { data: courseData } = useQuery({
    queryKey: ['courseDetail', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      try {
        const res = await axios.get(`/api/courses/${courseId}`);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(courseId)
  });

  const resolvedCourseTitle = courseData?.title || location.state?.courseTitle || (courseId ? courseId.replace(/-/g, ' ') : 'Spoken English Mastery');
  const resolvedCoursePrice = courseData?.price || location.state?.coursePrice || 2999;
  const resolvedCourseDuration = courseData?.duration || location.state?.courseDuration || '3 Months';
  const resolvedTrainer = courseData?.instructor || 'Siyaram Kumar & Senior Faculty';

  // Form states
  const [batchPreference, setBatchPreference] = useState('Morning Batch');
  const [notes, setNotes] = useState('');
  const [confirmationMethods, setConfirmationMethods] = useState<string[]>([
    'Email Confirmation',
    'WhatsApp Confirmation'
  ]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enrollmentResult, setEnrollmentResult] = useState<any>(null);

  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleMethod = (method: string) => {
    setConfirmationMethods(prev => 
      prev.includes(method)
        ? (prev.length > 1 ? prev.filter(m => m !== method) : prev) // keep at least one
        : [...prev, method]
    );
  };

  const handleInitialClick = () => {
    setError('');
    setShowConfirmModal(true);
  };

  const executeEnrollment = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        courseId: courseId || courseData?._id || 'spoken-english-mastery',
        courseName: resolvedCourseTitle,
        studentName: user?.name,
        email: user?.email,
        mobile: user?.mobile,
        batchPreference,
        notes,
        confirmationMethods,
        courseFee: resolvedCoursePrice,
        courseDuration: resolvedCourseDuration,
        trainerName: resolvedTrainer
      };

      const res = await axios.post('/api/enrollments', payload);
      setEnrollmentResult(res.data?.enrollment || res.data);
      setShowConfirmModal(false);
      toast.success('Enrollment submitted successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      setShowConfirmModal(false);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Receipt print/download simulation
  const handlePrintReceipt = () => {
    window.print();
  };

  const handleEmailReceipt = () => {
    toast.success(`Admission receipt dispatched to ${user?.email}`);
  };

  if (!user) return null;

  // Render Post-Enrollment Success Experience
  if (enrollmentResult) {
    const enrId = enrollmentResult.enrollmentId || `ETI-ENR-${new Date().getFullYear()}-45821`;
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Top Success Banner */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500" />
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-50 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-green-600 animate-bounce" />
            </div>
            <span className="inline-block bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-green-200">
              Admission Registration Confirmed
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Welcome to Easy Talk Institute!
            </h1>
            <p className="text-slate-600 text-base max-w-xl mx-auto mb-6">
              Your enrollment request for <strong className="text-blue-600 font-semibold">{resolvedCourseTitle}</strong> has been submitted. Our academic team is reviewing your batch schedule.
            </p>

            <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-mono text-sm border border-slate-200">
              <span className="text-slate-500 font-sans text-xs">Official ID:</span>
              <strong className="text-blue-700">{enrId}</strong>
            </div>
          </div>

          {/* Admission Status Tracker */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Admission Progress Tracker
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
              {[
                { title: 'Request Submitted', desc: 'Received in system', state: 'done' },
                { title: 'Admin Verification', desc: 'Document & profile check', state: 'active' },
                { title: 'Admission Approval', desc: 'Eligibility confirmed', state: 'pending' },
                { title: 'Batch Allocation', desc: `${batchPreference}`, state: 'pending' },
                { title: 'Welcome Notice', desc: 'Class link & materials', state: 'pending' }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 shadow-sm ${
                    step.state === 'done' 
                      ? 'bg-green-600 text-white' 
                      : step.state === 'active' 
                        ? 'bg-blue-600 text-white animate-pulse' 
                        : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step.state === 'done' ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 leading-snug">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Official Admission Receipt Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-100 print:shadow-none print:border-none">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Enrollment Receipt</span>
                <h3 className="text-xl font-bold text-slate-800">Easy Talk Institute Admission Slip</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleEmailReceipt}
                  className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Email Receipt
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Student Details</span>
                <p className="font-bold text-slate-800 text-base">{user.name}</p>
                <p className="text-slate-600">{user.email}</p>
                {user.mobile && <p className="text-slate-600">+91 {user.mobile}</p>}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Admission Summary</span>
                <p className="font-bold text-blue-900 text-base">{resolvedCourseTitle}</p>
                <p className="text-slate-600">Batch: <span className="font-medium text-slate-800">{batchPreference}</span></p>
                <p className="text-slate-600">Date: <span className="font-medium text-slate-800">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
              <span className="text-sm font-bold text-blue-900">Total Admission Fee</span>
              <span className="text-xl font-extrabold text-blue-700 flex items-center">
                <IndianRupee className="w-5 h-5 inline" /> {resolvedCoursePrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/student/courses"
              className="w-full sm:w-1/2 bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-center hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
            >
              Go to My Courses
            </Link>
            <Link
              to="/student/dashboard"
              className="w-full sm:w-1/2 bg-white text-slate-800 font-bold py-4 px-6 rounded-2xl text-center hover:bg-slate-100 transition border border-slate-200"
            >
              Open Student Portal
            </Link>
          </div>

          {/* Dedicated Help Support Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-1">Need Immediate Assistance?</h3>
                <p className="text-slate-300 text-sm max-w-md">
                  Our admissions office is ready to help you with onboarding, batch timings, and course queries.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <a
                  href="tel:+919431885389"
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-5 rounded-xl text-sm border border-white/20 transition-colors"
                >
                  <Phone className="w-4 h-4 text-orange-400" />
                  +91 9431885389
                </a>
                <a
                  href="https://wa.me/919431885389"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-5 rounded-xl text-sm transition-colors shadow-lg shadow-green-500/30"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Pre-Enrollment Confirmation Experience
  return (
    <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Breadcrumb & Title */}
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
            <GraduationCap className="w-4 h-4" />
            Official Admission Desk
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Confirm Your Course Admission
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Complete your admission preferences and secure your seat in the upcoming cohort.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Notice</h4>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Main Grid: 2 Columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & Preferences (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Current Information Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-5 h-5 text-blue-600" />
                Student & Course Verification
              </h2>

              <div className="space-y-4">
                <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    Selected Course
                  </label>
                  <p className="font-extrabold text-blue-950 text-lg sm:text-xl flex items-center justify-between">
                    <span>{resolvedCourseTitle}</span>
                    <span className="text-blue-600 text-sm font-semibold flex items-center">
                      <IndianRupee className="w-4 h-4 inline" /> {resolvedCoursePrice.toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Student Name
                    </label>
                    <p className="font-bold text-slate-800 text-sm sm:text-base">{user.name}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Registered Email
                    </label>
                    <p className="font-medium text-slate-700 text-sm truncate">{user.email}</p>
                  </div>
                </div>

                {user.mobile && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Mobile Number
                    </label>
                    <p className="font-semibold text-slate-800 text-sm">+91 {user.mobile}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Batch Preference Selection */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Batch Preference Selection
                </h2>
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                  Required
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Choose the timing that best fits your daily routine. Batches are conducted with limited cohort seats.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'Morning Batch', label: 'Morning Batch', time: '07:00 AM – 09:00 AM', emoji: '🌅' },
                  { id: 'Afternoon Batch', label: 'Afternoon Batch', time: '12:00 PM – 02:00 PM', emoji: '☀️' },
                  { id: 'Evening Batch', label: 'Evening Batch', time: '05:00 PM – 07:00 PM', emoji: '🌇' },
                  { id: 'Weekend Batch', label: 'Weekend Batch', time: 'Sat – Sun Intensive', emoji: '📅' }
                ].map(batch => (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setBatchPreference(batch.id)}
                    className={`p-4 rounded-2xl text-left border-2 transition-all flex items-start gap-3 ${
                      batchPreference === batch.id
                        ? 'border-blue-600 bg-blue-50/60 shadow-md shadow-blue-500/10'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{batch.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{batch.label}</span>
                        {batchPreference === batch.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">{batch.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes & Special Requirements Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                Notes & Special Requirements (Optional)
              </h2>

              <p className="text-xs text-slate-500">
                Mention your preferred contact time, career goals, or any specific questions for your trainer.
              </p>

              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="e.g. Preparing for software interview next month. Prefer counseling call after 6 PM."
                  rows={3}
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition"
                />
                <div className="flex justify-end text-[11px] text-slate-400 mt-1">
                  {notes.length} / 500 characters
                </div>
              </div>
            </div>

            {/* Confirm Enrollment CTA */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
              <button
                type="button"
                onClick={handleInitialClick}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-extrabold py-4 px-6 rounded-2xl hover:opacity-95 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 text-base sm:text-lg active:scale-[0.99] touch-manipulation"
              >
                <span>Confirm Enrollment</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                <span>🔒 Your enrollment information is securely stored and only used for academic and admission purposes.</span>
              </div>
            </div>

          </div>

          {/* Right Column: Premium Summary & Trust Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Premium Enrollment Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                Admission Summary
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                Easy Talk Institute Admission
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" /> Course
                  </span>
                  <span className="font-bold text-slate-900 text-right max-w-[180px]">{resolvedCourseTitle}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" /> Student
                  </span>
                  <span className="font-semibold text-slate-800">{user.name}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" /> Email
                  </span>
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">{user.email}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" /> Enrollment Date
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" /> Batch Timing
                  </span>
                  <span className="font-bold text-blue-700">{batchPreference}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" /> Duration
                  </span>
                  <span className="font-semibold text-slate-800">{resolvedCourseDuration}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Lead Trainer
                  </span>
                  <span className="font-semibold text-slate-800">{resolvedTrainer}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500" /> Campus
                  </span>
                  <span className="font-medium text-slate-700">Main Campus & Live Web</span>
                </div>

                <div className="flex items-center justify-between pt-3 text-base">
                  <span className="font-extrabold text-slate-900">Total Course Fee</span>
                  <span className="font-extrabold text-xl text-blue-600 flex items-center">
                    <IndianRupee className="w-5 h-5 inline" /> {resolvedCoursePrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Contact Options ("Need Help?" Section) */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div>
                <span className="text-xs font-bold text-orange-400 uppercase tracking-widest block mb-1">
                  Dedicated Support
                </span>
                <h3 className="text-xl font-bold">Have Questions? Call Us!</h3>
                <p className="text-slate-300 text-xs mt-1">
                  Our academic counselors are available to answer batch schedule & curriculum questions.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href="tel:+919431885389"
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-lg shadow-blue-500/20 text-sm active:scale-[0.99]"
                >
                  <Phone className="w-4 h-4 text-white" />
                  Call Institute (+91 9431885389)
                </a>

                <a
                  href="https://wa.me/919431885389"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-lg shadow-green-500/20 text-sm active:scale-[0.99]"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp Support
                </a>

                <a
                  href="mailto:siyaramkumar103@gmail.com"
                  className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-2xl transition text-sm border border-white/20"
                >
                  <Mail className="w-4 h-4 text-slate-300" />
                  Email Support (siyaramkumar103@gmail.com)
                </a>
              </div>
            </div>

            {/* Enrollment Benefits Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                What You Get Upon Enrollment
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { title: 'Full Course Access', icon: '🎓' },
                  { title: 'Study Material', icon: '📖' },
                  { title: 'Assessment Tests', icon: '📝' },
                  { title: 'SMS & Email Alerts', icon: '📢' },
                  { title: 'Trainer Guidance', icon: '👨‍🏫' },
                  { title: 'Progress Tracking', icon: '📊' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-base">{item.icon}</span>
                    <span className="font-semibold text-slate-800">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Choose Easy Talk Institute? Trust Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Why Choose Easy Talk Institute?
              </h4>

              <div className="space-y-2 text-xs text-slate-700">
                {[
                  'Live Interactive Classes with real-time feedback',
                  'Small Batch Size ensuring individual attention',
                  'Practical English Training for everyday fluency',
                  'Interview Preparation & Group Discussions',
                  'Personal Guidance from experienced faculty',
                  'Placement Support & CV building sessions'
                ].map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* What Happens Next? (Next Steps Timeline UI) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            What Happens Next? (Timeline)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { num: '1', title: 'Enrollment Submitted', desc: 'Your seat reservation is logged into the student ledger.' },
              { num: '2', title: 'Admin Reviews Request', desc: 'Our team verifies slot availability and requirements.' },
              { num: '3', title: 'Student Receives Confirmation', desc: 'Confirmation dispatch via WhatsApp & Email.' },
              { num: '4', title: 'Batch Assigned', desc: 'Your cohort group and timing details are linked.' },
              { num: '5', title: 'Classes Start', desc: 'Begin live interactive sessions and practice stories.' }
            ].map((step, idx) => (
              <div key={idx} className="relative p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-3">
                    {step.num}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{step.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {[
              {
                q: 'How long does approval take?',
                a: 'Most enrollment requests are verified and approved within 2 to 24 hours by our academic admissions team.'
              },
              {
                q: 'How will I receive confirmation?',
                a: 'You will receive immediate confirmation on your Student Dashboard, along with confirmation on your chosen channels (Email and WhatsApp).'
              },
              {
                q: 'Can I change my batch?',
                a: 'Yes! You can request a batch change anytime before class starts by contacting our academic support at +91 9431885389.'
              },
              {
                q: 'Who should I contact for support?',
                a: 'You can call us directly at +91 9431885389, WhatsApp us, or email siyaramkumar103@gmail.com for priority assistance.'
              },
              {
                q: 'Can I cancel enrollment?',
                a: 'Yes, enrollment cancellation is permitted within 48 hours of booking prior to class commencement.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between font-bold text-sm text-slate-800 hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${activeFaq === idx ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Confirmation Channel Preference Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirmation Preferences</h3>
              <p className="text-xs text-slate-600 mt-1">
                How would you like to receive your admission confirmation & cohort updates?
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'Email Confirmation', label: 'Email Confirmation', desc: `Send receipt & updates to ${user.email}`, icon: '📧' },
                { id: 'WhatsApp Confirmation', label: 'WhatsApp Confirmation', desc: 'Direct message with class link & counselor chat', icon: '💬' },
                { id: 'SMS Confirmation', label: 'SMS Confirmation', desc: 'Urgent batch & schedule SMS notifications', icon: '📱' }
              ].map(opt => {
                const isSelected = confirmationMethods.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMethod(opt.id)}
                    className={`w-full p-4 rounded-2xl text-left border-2 flex items-start gap-3 transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-100 bg-slate-50/40 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{opt.label}</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/3 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={executeEnrollment}
                disabled={loading}
                className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:opacity-95 transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : 'Submit & Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
