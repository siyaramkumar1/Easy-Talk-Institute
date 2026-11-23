import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  X,
  ArrowLeft,
  Sparkles,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Target,
  Award,
  Play
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';


interface Question {
  _id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export default function Test() {
  const { slug } = useParams();
  
  const [testInfo, setTestInfo] = useState({ title: 'English Test', time: 15 });
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
  
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Used to prevent auto-submit from triggering multiple times
  const hasSubmitted = useRef(false);
  const questionCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please login to start your English test.' } });
      return;
    }

    const fetchAttempt = async () => {
      try {
        const res = await axios.get(`/api/tests/attempt/${slug}`);
        setAttemptId(res.data.attemptId);
        setQuestions(res.data.questions);
        setTestInfo({ title: res.data.testTitle, time: res.data.duration });
        setCurrentAnswers(res.data.answers || {});
        
        // Calculate remaining time
        const expiresAt = new Date(res.data.expiresAt).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
        
        // If already expired, or close, maybe auto submit? 
        // We'll let the user click 'Begin Test' and timer will handle it or start there
        if (diffSeconds > 0) {
          setTimeLeft(diffSeconds);
        } else {
          setTimeLeft(res.data.duration * 60);
        }

      } catch (err) {
        console.error('Failed to fetch test attempt', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [slug, isAuthenticated, navigate]);

  useEffect(() => {
    let timer: any;
    if (testStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            autoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  // Debounced auto-save
  useEffect(() => {
    if (!testStarted || !attemptId) return;
    
    const timeout = setTimeout(() => {
      axios.post(`/api/tests/save/${attemptId}`, { answers: currentAnswers }).catch(e => console.error("Auto-save failed", e));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [currentAnswers, attemptId, testStarted]);

  const handleStart = () => {
    setTestStarted(true);
  };

  const autoSubmit = async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    try {
      const res = await axios.post(`/api/tests/submit/${attemptId}`, {
        answers: currentAnswers,
        testName: testInfo.title
      });
      const resultData = res.data;
      navigate(`/assessment/result/${resultData._id}`, { state: { result: resultData } });
    } catch (error) {
      console.error('Submit failed', error);
      toast.error('Error submitting test. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    try {
      const res = await axios.post(`/api/tests/submit/${attemptId}`, {
        answers: currentAnswers,
        testName: testInfo.title
      });
      const resultData = res.data;
      navigate(`/assessment/result/${resultData._id}`, { state: { result: resultData } });
    } catch (error) {
      console.error('Submit failed', error);
      toast.error('Error submitting test. Please try again.');
      hasSubmitted.current = false;
      setShowSubmitModal(false);
    }
  };

  const handleAnswer = (questionId: string, option: string) => {
    setCurrentAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] pt-8 flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-900 border-t-transparent"></div>
        <p className="mt-3 text-xs sm:text-sm font-medium text-slate-500">Loading assessment details...</p>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] w-full overflow-x-hidden pt-1 pb-10">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
          
          {/* ========================================================= */}
          {/* ASSESSMENT HERO CARD                                      */}
          {/* Margin Top: 8px–12px (mt-2 sm:mt-2.5)                     */}
          {/* Padding Top: 0px–4px (pt-1 on container)                  */}
          {/* Navbar Bottom → Assessment Card Top = 8px–12px            */}
          {/* Rounded corners (20px), Soft shadow, Light gradient       */}
          {/* ========================================================= */}
          <div className="mt-2 sm:mt-2.5 rounded-[20px] bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white p-5 sm:p-7 shadow-md border border-blue-900/60 relative overflow-hidden transition-all">
            {/* Ambient decorative glow */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none hidden sm:block">
              <Award className="w-36 h-36 text-white" />
            </div>

            <div className="relative z-10">
              {/* Back to Tests & Status Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <Link
                  to="/tests"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>All Tests</span>
                </Link>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-white/10 backdrop-blur-md text-blue-100 border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ready to Begin
                </span>
              </div>

              {/* Category / Test Type Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/15 mb-2.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Easy Talk Official Assessment</span>
              </div>

              {/* Main Heading: Test Name */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
                {testInfo.title}
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal max-w-xl mb-5">
                Evaluate your English accuracy, grammar mastery, and comprehension skills under timed examination conditions.
              </p>

              {/* Quick Metrics Grid (Coursera / Udemy style stats row) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-4 border-t border-white/15">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center flex flex-col items-center justify-center">
                  <span className="text-[11px] font-semibold text-blue-200 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-300" />
                    <span>Questions</span>
                  </span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {questions.length}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center flex flex-col items-center justify-center">
                  <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Duration</span>
                  </span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {Math.ceil(timeLeft / 60)} Mins
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center flex flex-col items-center justify-center">
                  <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Passing Score</span>
                  </span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                    60%
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center flex flex-col items-center justify-center">
                  <span className="text-[11px] font-semibold text-purple-200 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-300" />
                    <span>Certification</span>
                  </span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                    Verified
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Instructions Card */}
          <div className="mt-4 bg-white rounded-[18px] border border-slate-200/90 p-5 sm:p-6 shadow-xs">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Assessment Rules & Instructions</span>
            </h2>

            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Uninterrupted Session:</strong> Ensure a stable internet connection. Answers are automatically saved in the background.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Timed Examination:</strong> Once you tap <em>"Begin Test Now"</em>, the {Math.ceil(timeLeft / 60)}-minute timer begins and cannot be paused.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Flexible Navigation:</strong> You can revisit any question using the Question Grid before submitting.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Instant Score Report:</strong> Receive your detailed score analysis and CEFR equivalent rating immediately upon completion.</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleStart}
                className="w-full sm:flex-1 h-[50px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm sm:text-base rounded-[14px] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Begin Test Now</span>
              </button>
              <Link
                to="/tests"
                className="w-full sm:w-auto h-[50px] px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-[14px] flex items-center justify-center transition-colors text-center"
              >
                Back to Tests
              </Link>
            </div>
          </div>

        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = Math.round((Object.keys(currentAnswers).length / questions.length) * 100);

  const handleSelectQuestion = (idx: number) => {
    setCurrentIndex(idx);
    questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="pt-0 min-h-screen bg-slate-50 flex flex-col justify-between overflow-x-hidden">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* ========================================================= */}
        {/* 1. TOP TEST HEADER CARD                                   */}
        {/* Spacing: Navbar → Test Header = 8px (mt-2)                */}
        {/* Rounded 18px, Padding 18px, Soft Shadow                   */}
        {/* Title → Question Number = 8px (mt-2)                      */}
        {/* Question Number → Timer = 12px (mt-3)                     */}
        {/* Header → Question Card = 16px                             */}
        {/* ========================================================= */}
        <div className="mt-2 bg-white rounded-[18px] p-[18px] shadow-sm border border-slate-200/90 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {/* Title */}
              <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <span className="text-xl select-none">📝</span>
                <span>{testInfo.title}</span>
              </h1>

              {/* Spacing: Title → Question Number = 8px (mt-2) */}
              <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>

            {/* Quick jump to palette on mobile & desktop */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  const palette = document.getElementById('question-palette');
                  palette?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                title="Jump to Question Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                <span>Grid ({Object.keys(currentAnswers).length}/{questions.length})</span>
              </button>
            </div>
          </div>

          {/* Spacing: Question Number → Timer = 12px (mt-3) */}
          <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs sm:text-sm ${
              timeLeft < 300 
                ? 'bg-red-50 text-red-600 border border-red-200' 
                : 'bg-orange-50 text-orange-600 border border-orange-200'
            }`}>
              <Clock className="w-4 h-4 shrink-0" />
              <span>⏱ {formatTime(timeLeft)} Remaining</span>
            </div>

            <span className="text-xs font-bold text-slate-400">
              {progress}% Completed
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. QUESTION SECTION                                       */}
        {/* Spacing: Header → Question Card = 16px (mt-4)             */}
        {/* Question Card Padding = 20px (p-5)                        */}
        {/* Question Number → Question = 16px (mb-4)                  */}
        {/* Question Text Line Height = 1.7 (leading-[1.7])           */}
        {/* Question Bottom Margin = 20px (mb-5)                      */}
        {/* ========================================================= */}
        <div 
          ref={questionCardRef}
          className="mt-4 bg-white rounded-[18px] sm:rounded-2xl border border-slate-200/90 shadow-sm p-5 transition-all"
        >
          {/* Question Number Badge / Label */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/70">
              <span>Question {currentIndex + 1}</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Single Choice
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 leading-[1.7] mb-5 tracking-tight">
            {currentQ?.text}
          </h2>

          {/* ======================================================= */}
          {/* 3. OPTIONS SECTION                                      */}
          {/* Question → Options = 20px (achieved by mb-5 above)     */}
          {/* Height Minimum 54px (min-h-[54px])                      */}
          {/* Rounded 14px (rounded-[14px])                           */}
          {/* Padding 16px (p-4)                                      */}
          {/* Gap Between Options = 12px (space-y-3)                  */}
          {/* Large Touch Area & Clear Selection Highlight            */}
          {/* ======================================================= */}
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((opt) => {
              const isSelected = currentAnswers[currentQ?._id] === opt;
              const optText = currentQ ? (currentQ as any)[`option${opt}`] : '';

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleAnswer(currentQ?._id, opt)}
                  className={`w-full min-h-[54px] text-left p-4 rounded-[14px] border-2 transition-all flex items-center gap-3.5 cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  {/* Option Badge */}
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {opt}
                  </span>

                  {/* Option Text */}
                  <span
                    className={`text-sm sm:text-base leading-relaxed ${
                      isSelected
                        ? 'font-bold text-blue-950'
                        : 'font-medium text-slate-800'
                    }`}
                  >
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ======================================================= */}
          {/* 4. PREV/NEXT BUTTONS                                    */}
          {/* Options → Navigation Buttons = 24px (mt-6)              */}
          {/* Container Margin Top = 24px (mt-6)                      */}
          {/* Height 48px–52px (h-[50px] min-h-[48px] max-h-[52px])   */}
          {/* Rounded 12px (rounded-[12px])                           */}
          {/* Equal Width (flex-1)                                    */}
          {/* Gap Between Buttons = 12px (gap-3)                      */}
          {/* ======================================================= */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              className="flex-1 h-[50px] min-h-[48px] max-h-[52px] flex items-center justify-center gap-2 bg-white border border-slate-200/90 rounded-[12px] font-bold text-xs sm:text-sm text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:bg-slate-100 shadow-2xs transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="flex-1 h-[50px] min-h-[48px] max-h-[52px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-[12px] font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <span>Submit Test</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                className="flex-1 h-[50px] min-h-[48px] max-h-[52px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-[12px] font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. QUESTION PALETTE                                       */}
        {/* Spacing: Navigation Buttons → Question Palette = 24px     */}
        {/* Card Style: Rounded 18px, Padding 20px, Soft Shadow       */}
        {/* Grid Gap = 10px (gap-[10px])                              */}
        {/* Question Box Size = 40px–44px                             */}
        {/* Visual Status Colors: Answered / Not Answered / Current   */}
        {/* ========================================================= */}
        <div 
          id="question-palette"
          className="mt-6 bg-white rounded-[18px] p-5 border border-slate-200/90 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
              <span>Questions</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {Object.keys(currentAnswers).length} of {questions.length} answered
            </span>
          </div>

          {/* Grid with 10px Gap */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-[10px]">
            {questions.map((q, idx) => {
              const isAns = !!currentAnswers[q._id];
              const isCur = currentIndex === idx;

              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => handleSelectQuestion(idx)}
                  className={`w-[42px] h-[42px] min-w-[40px] max-w-[44px] aspect-square rounded-[10px] mx-auto flex items-center justify-center text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer active:scale-95 ${
                    isCur
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/25 shadow-xs'
                      : isAns
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                      : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  title={`Question ${idx + 1}: ${isAns ? 'Answered' : 'Not Answered'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 6. STATUS LEGEND CARD                                     */}
        {/* Spacing: Palette → Status Legend = 16px (mt-4)            */}
        {/* Padding: 16px (p-4)                                       */}
        {/* Rounded: 14px (rounded-[14px])                            */}
        {/* Margin Top: 16px (mt-4)                                   */}
        {/* Spacing: Status Legend → Footer = 32px (mb-8)              */}
        {/* ========================================================= */}
        <div className="mt-4 mb-8 bg-white rounded-[14px] p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-600 inline-block shadow-2xs" />
              <span>Answered</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-300 inline-block" />
              <span>Not Answered</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-blue-600 inline-block ring-2 ring-blue-300" />
              <span>Current Question</span>
            </div>
          </div>
        </div>

      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Submit Test?</h3>
            <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
              Are you sure you want to submit? You cannot change your answers after submission.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 h-11 bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 h-11 bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-emerald-700 shadow-xs transition-colors"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
