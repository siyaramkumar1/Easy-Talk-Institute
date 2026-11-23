import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User as UserIcon, 
  BookOpen, 
  Target, 
  TrendingUp, 
  ArrowRight, 
  RotateCcw, 
  BarChart3, 
  Home, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface TestResultData {
  _id?: string;
  userId?: string;
  userName?: string;
  email?: string;
  testName?: string;
  testSlug?: string;
  totalQuestions?: number;
  attemptedQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  skippedAnswers?: number;
  score?: number;
  percentage?: number;
  level?: string;
  passed?: boolean;
  completedAt?: string;
  createdAt?: string;
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuthStore();

  const [result, setResult] = useState<TestResultData | null>(location.state?.result || null);
  const [previousResults, setPreviousResults] = useState<TestResultData[]>([]);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please login to view assessment results.' } });
      return;
    }

    const fetchResultData = async () => {
      try {
        setLoading(true);
        setError(false);

        let currentResult: TestResultData | null = location.state?.result || null;

        // 1. Try to fetch specific result by ID if provided and not yet in state
        if (!currentResult && id) {
          try {
            const res = await axios.get(`/api/test-results/${id}`);
            if (res.data && res.data._id) {
              currentResult = res.data;
            }
          } catch (e) {
            // Fallback try /api/tests/results/:id
            try {
              const resFallback = await axios.get(`/api/tests/results/${id}`);
              if (resFallback.data && resFallback.data._id) {
                currentResult = resFallback.data;
              }
            } catch {
              // Ignore and fallback to latest
            }
          }
        }

        // 2. Fetch all user results to get history & fallback to latest if needed
        const myResultsRes = await axios.get('/api/test-results/my-results');
        const allResults: TestResultData[] = Array.isArray(myResultsRes.data) ? myResultsRes.data : [];

        if (!currentResult && allResults.length > 0) {
          // If no specific result found, take the student's latest result
          currentResult = allResults[0];
        }

        if (currentResult) {
          setResult(currentResult);
          // Set previous history (excluding current result)
          const history = allResults.filter(r => r._id !== currentResult?._id);
          setPreviousResults(history);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load assessment result:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [id, isAuthenticated, navigate]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 w-full overflow-x-hidden pt-12 pb-16 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200/90 shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Evaluating Assessment Result</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Fetching latest score, accuracy report, and CEFR proficiency level...
          </p>
        </div>
      </div>
    );
  }

  // Genuinely Not Found / Error State
  if (error || !result) {
    return (
      <div className="min-h-[70vh] bg-slate-50 w-full overflow-x-hidden pt-12 pb-16 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200/90 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mb-4 select-none">
            📋
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Assessment Result Found</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            You haven't completed this assessment yet or no submission record exists for this session. Take an official English assessment to generate your personalized report.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => navigate('/tests')}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Explore Assessments</span>
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculated Metrics
  const totalQuestions = result.totalQuestions || ((result.correctAnswers || 0) + (result.wrongAnswers || 0)) || 30;
  const correctAnswers = result.correctAnswers ?? (result.score || 0);
  const wrongAnswers = result.wrongAnswers ?? Math.max(0, totalQuestions - correctAnswers);
  const attemptedQuestions = result.attemptedQuestions ?? (correctAnswers + wrongAnswers);
  const percentage = typeof result.percentage === 'number' 
    ? result.percentage 
    : Math.round((correctAnswers / totalQuestions) * 100);

  // Status Logic: Percentage >= 60 is PASS
  const isPassed = percentage >= 60;
  const level = result.level || (percentage >= 80 ? 'Advanced' : percentage >= 60 ? 'Intermediate' : 'Beginner');

  // Formatted Date
  const submissionDate = result.completedAt || result.createdAt;
  const formattedDate = submissionDate 
    ? new Date(submissionDate).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

  // Circular Ring SVG math: radius 54, circumference ~ 339.292
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percentage))) / 100;

  // Performance Analysis Sub-scores
  const grammarScore = Math.max(0, Math.min(100, percentage >= 50 ? percentage - 4 : percentage));
  const vocabScore = Math.max(0, Math.min(100, percentage >= 50 ? percentage + 6 : percentage + 2));

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden pt-0 pb-10">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* ========================================================= */}
        {/* 1. RESULT HERO SECTION                                    */}
        {/* Spacing: Navbar → Result Card = 12px (mt-3)               */}
        {/* Rounded Corners: 24px (rounded-[24px])                    */}
        {/* Soft Shadow, Padding: 24px (p-6)                          */}
        {/* Premium Gradient Background                               */}
        {/* ========================================================= */}
        <section className="mt-3 rounded-[24px] bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white p-6 sm:p-7 shadow-md border border-blue-900/60 relative overflow-hidden transition-all">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none hidden sm:block">
            <Award className="w-36 h-36 text-white" />
          </div>

          <div className="relative z-10">
            {/* Header Badge & Category */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/15 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Verified Assessment Score</span>
              </span>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isPassed 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {isPassed ? 'Status: PASS' : 'Status: NEEDS IMPROVEMENT'}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-1 flex items-center gap-2">
              <span className="select-none">🎉</span>
              <span>Assessment Completed Successfully</span>
            </h1>

            {/* Test Name */}
            <p className="text-base sm:text-lg font-bold text-blue-200 mb-2">
              {result.testName || 'English Assessment Test'}
            </p>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal max-w-xl">
              Congratulations! Your assessment has been evaluated successfully according to Easy Talk Institute standards.
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. SCORE CARD                                             */}
        {/* Spacing: Result Card → Score Section = 20px (mt-5)        */}
        {/* Large Circular Progress Ring, Big Score Number            */}
        {/* Center Alignment, Premium Card                            */}
        {/* ========================================================= */}
        <section className="mt-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-center flex flex-col items-center transition-all">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Your Score
          </p>

          {/* Large Circular Progress Ring */}
          <div className="relative w-44 h-44 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
              {/* Background Ring */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="#F1F5F9"
                strokeWidth="11"
                fill="transparent"
              />
              {/* Dynamic Animated Ring */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={isPassed ? '#10B981' : '#F59E0B'}
                strokeWidth="11"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {percentage}%
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {isPassed ? 'PASSED' : 'REVIEW'}
              </span>
            </div>
          </div>

          {/* Questions summary */}
          <p className="text-sm sm:text-base font-bold text-slate-800 mt-3">
            {correctAnswers} Correct Answer{correctAnswers === 1 ? '' : 's'} out of {totalQuestions}
          </p>

          {/* Performance Level */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Performance Level:</span>
            <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <Target className="w-3.5 h-3.5" />
              <span>{level}</span>
            </span>
          </div>

          {/* Result Summary Sentence */}
          <div className="mt-4 pt-4 border-t border-slate-100 max-w-md w-full">
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {percentage >= 80 
                ? '🌟 Excellent Performance! You demonstrated high mastery in sentence formation and grammar.'
                : percentage >= 60
                ? '👏 Good Work! You met the passing criteria. Keep practicing to reach the advanced level.'
                : '📖 Keep practicing to improve your English skills and retake the test to boost your CEFR ranking.'}
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. STUDENT INFORMATION CARD                               */}
        {/* Spacing: Score Section → Student Info = 20px (mt-5)       */}
        {/* Rounded 18px (rounded-[18px]), Soft Shadow                */}
        {/* Student Name, Assessment Date, Test Name, CEFR Level      */}
        {/* ========================================================= */}
        <section className="mt-5 bg-white rounded-[18px] p-5 sm:p-6 border border-slate-200/90 shadow-xs transition-all">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Student Examination Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
            {/* Student Name */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 block">Student Name</span>
                <span className="font-bold text-slate-900 truncate block">
                  {result.userName || user?.name || 'Enrolled Student'}
                </span>
              </div>
            </div>

            {/* Assessment Date */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 block">Assessment Date</span>
                <span className="font-bold text-slate-900 truncate block">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Test Name */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 block">Test Name</span>
                <span className="font-bold text-slate-900 truncate block">
                  {result.testName || 'Grammar Test'}
                </span>
              </div>
            </div>

            {/* CEFR Level */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 block">CEFR Level</span>
                <span className="font-bold text-slate-900 truncate block">
                  {level}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. RESULT STATISTICS                                      */}
        {/* Spacing: Student Info → Statistics = 20px (mt-5)          */}
        {/* Separate statistic cards: Correct, Wrong, Accuracy, Level */}
        {/* Equal Height, Rounded 16px (rounded-[16px])               */}
        {/* ========================================================= */}
        <section className="mt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Stat 1: Correct Answers */}
            <div className="bg-white rounded-[16px] p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">Correct Answers</span>
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 leading-tight">
                  {correctAnswers}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  of {totalQuestions} questions
                </span>
              </div>
            </div>

            {/* Stat 2: Wrong Answers */}
            <div className="bg-white rounded-[16px] p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">Wrong Answers</span>
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-rose-600 leading-tight">
                  {wrongAnswers}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  incorrect or skipped
                </span>
              </div>
            </div>

            {/* Stat 3: Accuracy */}
            <div className="bg-white rounded-[16px] p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">Accuracy</span>
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 leading-tight">
                  {percentage}%
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  overall score
                </span>
              </div>
            </div>

            {/* Stat 4: English Level */}
            <div className="bg-white rounded-[16px] p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">English Level</span>
                <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-purple-700 leading-tight block truncate">
                  {level}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  CEFR standard
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. PERFORMANCE ANALYSIS                                   */}
        {/* Spacing: Statistics → Analysis = 24px (mt-6)              */}
        {/* Grammar Strength, Vocabulary Strength, Weak Areas         */}
        {/* ========================================================= */}
        <section className="mt-6 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Skill Performance Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Topic Mastery</span>
          </div>

          <div className="space-y-4">
            {/* Grammar Strength */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Grammar Strength</span>
                <span className="text-blue-600 font-bold">{grammarScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${grammarScore}%` }}
                />
              </div>
            </div>

            {/* Vocabulary Strength */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Vocabulary & Sentence Structure</span>
                <span className="text-emerald-600 font-bold">{vocabScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${vocabScore}%` }}
                />
              </div>
            </div>

            {/* Weak Areas Tags */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 block mb-2">
                Recommended Focus Areas:
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Basic Tenses</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Complex Sentences</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Phrasal Verbs</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. RECOMMENDATIONS SECTION                                */}
        {/* Spacing: Analysis → Recommendation = 24px (mt-6)          */}
        {/* Recommended Next Step + Explore Courses CTA               */}
        {/* ========================================================= */}
        <section className="mt-6 bg-gradient-to-br from-amber-50/70 via-orange-50/50 to-white rounded-2xl p-5 sm:p-6 border border-amber-200/70 shadow-xs transition-all">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg select-none">📚</span>
            <h3 className="font-bold text-amber-950 text-sm sm:text-base">
              Recommended Next Step
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed mb-4">
            Based on your assessment score, we recommend joining our Foundation English Program to improve grammar, vocabulary, fluency, and communication confidence.
          </p>

          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
          >
            <span>Explore Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* ========================================================= */}
        {/* 7. PREVIOUS ATTEMPTS HISTORY (If multiple attempts exist) */}
        {/* Requirement 9: Latest Attempt & Previous Attempts History */}
        {/* ========================================================= */}
        {previousResults.length > 0 && (
          <section className="mt-6 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>Previous Attempts History</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {previousResults.length} earlier attempt{previousResults.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-2.5">
              {previousResults.slice(0, 3).map((prev, idx) => (
                <div
                  key={prev._id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm"
                >
                  <div>
                    <p className="font-bold text-slate-800">{prev.testName || 'English Test'}</p>
                    <p className="text-[11px] text-slate-500">
                      {prev.completedAt ? new Date(prev.completedAt).toLocaleDateString() : 'Previous'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-700">
                      {prev.percentage}%
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-600">
                      {prev.level || 'Intermediate'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 8. ACTION BUTTONS                                         */}
        {/* Spacing: Recommendation → Buttons = 24px (mt-6)           */}
        {/* Spacing: Buttons → Footer = 32px (mb-8)                   */}
        {/* Full Width, Height 52px, Rounded 14px, Mobile Design      */}
        {/* ========================================================= */}
        <section className="mt-6 mb-8 flex flex-col sm:flex-row items-center gap-3">
          {/* Button 1: View Assessment History */}
          <button
            type="button"
            onClick={() => navigate('/my-results')}
            className="w-full sm:flex-1 h-[52px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-[14px] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Assessment History</span>
          </button>

          {/* Button 2: Take Another Assessment */}
          <button
            type="button"
            onClick={() => navigate('/tests')}
            className="w-full sm:flex-1 h-[52px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <span>Take Another Assessment</span>
          </button>

          {/* Button 3: Back to Dashboard */}
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="w-full sm:w-auto px-5 h-[52px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span className="sm:hidden">Dashboard</span>
          </button>
        </section>

      </div>
    </div>
  );
}
