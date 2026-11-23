import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Search, 
  GraduationCap, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Trophy, 
  Target, 
  Award, 
  TrendingUp, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';

const filterOptions = ['All Tests', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function TestCategories() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Tests');
  const [completedTests, setCompletedTests] = useState<Record<string, { score: number; total: number; percentage: number }>>({});
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testCategories, setTestCategories] = useState<any[]>([]);
  const [startingSlug, setStartingSlug] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await axios.get('/api/admin-tests?status=Published');
      const tests = Array.isArray(response.data) ? response.data : [];
      setTestCategories(tests);
    } catch (error) {
      console.error('Failed to fetch tests', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please login to start your English test.' } });
    } else {
      fetchUserResults();
    }
  }, [isAuthenticated, navigate]);

  const fetchUserResults = async () => {
    try {
      const response = await axios.get('/api/tests/my-results');
      const results = Array.isArray(response.data) ? response.data : [];
      setUserResults(results);

      const resultsMap: Record<string, { score: number; total: number; percentage: number }> = {};
      results.forEach((result: any) => {
        const total = (result.correctAnswers || 0) + (result.wrongAnswers || 0) || 30;
        const percentage = typeof result.percentage === 'number'
          ? result.percentage
          : Math.round(((result.score || 0) / total) * 100);

        if (!resultsMap[result.testSlug] || result.score > resultsMap[result.testSlug].score) {
          resultsMap[result.testSlug] = {
            score: result.score || 0,
            total,
            percentage
          };
        }
      });
      setCompletedTests(resultsMap);
    } catch (error) {
      console.error('Failed to fetch user results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = (slug: string) => {
    setStartingSlug(slug);
    navigate(`/tests/${slug}`);
  };

  // Helper for difficulty label & styling
  const getDifficultyInfo = (level?: string) => {
    const norm = (level || '').toLowerCase();
    if (norm === 'beginner') {
      return {
        label: '🟢 Beginner',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500'
      };
    }
    if (norm === 'intermediate' || norm === 'medium') {
      return {
        label: '🟡 Intermediate',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500'
      };
    }
    if (norm === 'advanced' || norm === 'hard') {
      return {
        label: '🔴 Advanced',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500'
      };
    }
    return {
      label: '🔵 All Levels',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      dotColor: 'bg-blue-500'
    };
  };

  // Filter logic
  const filteredTests = testCategories.filter((test) => {
    const titleMatch = (test.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = (test.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const diffMatch = (test.difficulty || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || categoryMatch || diffMatch;

    let matchesFilter = true;
    if (activeFilter !== 'All Tests') {
      const activeLower = activeFilter.toLowerCase();
      const testDiff = (test.difficulty || '').toLowerCase();
      if (activeLower === 'intermediate') {
        matchesFilter = testDiff === 'intermediate' || testDiff === 'medium';
      } else {
        matchesFilter = testDiff === activeLower;
      }
    }

    return matchesSearch && matchesFilter;
  });

  // Real Database Statistics
  const availableTestsCount = testCategories.length;
  const testsAttemptedCount = Object.keys(completedTests).length;
  const completionRate = availableTestsCount > 0 
    ? Math.min(100, Math.round((testsAttemptedCount / availableTestsCount) * 100)) 
    : 0;

  const bestScore = userResults.length > 0
    ? Math.max(...userResults.map((r: any) => {
        if (typeof r.percentage === 'number') return r.percentage;
        const total = (r.correctAnswers || 0) + (r.wrongAnswers || 0) || 30;
        return Math.round(((r.score || 0) / total) * 100);
      }))
    : 0;

  const averageScore = userResults.length > 0
    ? Math.round(
        userResults.reduce((acc: number, r: any) => {
          const pct = typeof r.percentage === 'number'
            ? r.percentage
            : Math.round(((r.score || 0) / Math.max(1, (r.correctAnswers || 0) + (r.wrongAnswers || 0) || 30)) * 100);
          return acc + pct;
        }, 0) / userResults.length
      )
    : 0;

  // Certificates earned (passed with >= 60%)
  const certificatesEarned = Object.values(completedTests).filter((t: { score: number; total: number; percentage: number }) => t.percentage >= 60).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] w-full overflow-x-hidden pt-0 sm:pt-1 pb-8">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* 1. PAGE HERO SECTION                                      */}
        {/* Spacing: Navbar Bottom → Hero Card Top = 8px–12px         */}
        {/* Margin Top: 8px–12px (mt-2 sm:mt-2.5)                     */}
        {/* Padding Top: 0px–4px (pt-0 sm:pt-1 on root)               */}
        {/* Rounded Corners (20px), Soft Shadow, Padding 20px         */}
        {/* Margin Bottom 20px (mb-5)                                 */}
        {/* Real Stats: Available Tests, Completion Rate, Best Score  */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white p-5 sm:p-6 shadow-md border border-blue-900/60 mt-2 sm:mt-2.5 mb-5 transition-all">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none hidden md:block">
            <GraduationCap className="w-44 h-44 text-white" />
          </div>

          <div className="relative z-10">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/15 mb-2 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Official Institute Testing</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                  <span className="select-none">📝</span>
                  <span>English Assessment Tests</span>
                </h1>
              </div>

              {/* Status Indicator */}
              <div className="self-start sm:self-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-blue-100 border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Testing Engine
                </span>
              </div>
            </div>

            {/* Subtitle Description */}
            <p className="text-xs sm:text-sm md:text-base text-blue-100/90 leading-relaxed font-normal max-w-2xl mb-5">
              Evaluate your grammar, communication, vocabulary, and English proficiency through structured assessments.
            </p>

            {/* Statistics Row: Real Database Values */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-white/15">
              {/* Stat 1: Available Tests */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] sm:text-xs font-semibold text-blue-200 flex items-center gap-1">
                  <span className="text-xs select-none">📋</span>
                  <span>Available Tests</span>
                </span>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-0.5">
                  {isLoading ? '...' : availableTestsCount}
                </p>
              </div>

              {/* Stat 2: Completion Rate */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  <span className="text-xs select-none">🎯</span>
                  <span>Completion Rate</span>
                </span>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-0.5">
                  {isLoading ? '...' : `${completionRate}%`}
                </p>
              </div>

              {/* Stat 3: Best Score */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] sm:text-xs font-semibold text-amber-300 flex items-center gap-1">
                  <span className="text-xs select-none">🏆</span>
                  <span>Best Score</span>
                </span>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-0.5">
                  {isLoading ? '...' : (bestScore > 0 ? `${bestScore}%` : '—')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. SEARCH SECTION                                         */}
        {/* Spacing: Hero → Search = 16px (mt-4)                      */}
        {/* Height 50px, Rounded 14px, Search Icon, Internal Padding  */}
        {/* ========================================================= */}
        <div className="mt-4">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessments..."
              className="w-full h-[50px] pl-11 pr-4 rounded-[14px] border border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. FILTER SECTION                                         */}
        {/* Spacing: Search → Filters = 16px (mt-4)                   */}
        {/* Rounded Pills, Active Highlight, Horizontal Scroll        */}
        {/* Better Mobile Touch Targets                               */}
        {/* ========================================================= */}
        <div className="mt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {filterOptions.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`min-h-[42px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. PROGRESS SECTION                                       */}
        {/* Spacing: Filters → Progress = 20px (mt-5)                 */}
        {/* Header: "Your Assessment Progress"                        */}
        {/* Summary Cards: Tests Attempted, Best Score,               */}
        {/* Certificates Earned, Average Score (Real DB Values)       */}
        {/* ========================================================= */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Your Assessment Progress</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Real-time sync</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Tests Attempted */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">
                📝
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-500 block truncate">
                  Tests Attempted
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {isLoading ? '...' : testsAttemptedCount}
                </span>
              </div>
            </div>

            {/* Card 2: Best Score */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                🏆
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-500 block truncate">
                  Best Score
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {isLoading ? '...' : (bestScore > 0 ? `${bestScore}%` : '—')}
                </span>
              </div>
            </div>

            {/* Card 3: Certificates Earned */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">
                🎖️
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-500 block truncate">
                  Certificates Earned
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {isLoading ? '...' : certificatesEarned}
                </span>
              </div>
            </div>

            {/* Card 4: Average Score */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                🎯
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-500 block truncate">
                  Average Score
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {isLoading ? '...' : (averageScore > 0 ? `${averageScore}%` : '—')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. ASSESSMENT CARDS SECTION                               */}
        {/* Spacing: Progress → Assessment Cards = 20px (mt-5)        */}
        {/* Card Gap = 16px (gap-4)                                   */}
        {/* Cards → Footer = 32px (mb-8 on root/cards)                */}
        {/* Each Card Displays: Test Name, Difficulty Level,          */}
        {/* Total Questions, Duration, Attempt Status, Pass Criteria  */}
        {/* CTA: 🚀 Start Assessment (Height 50px, Rounded 14px)      */}
        {/* ========================================================= */}
        <div className="mt-5 mb-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-[18px] p-5 border border-slate-200/90 shadow-xs animate-pulse">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-6 w-24 bg-slate-200 rounded-full" />
                    <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded mb-4" />
                  <div className="h-16 bg-slate-100 rounded-xl mb-4" />
                  <div className="h-[50px] bg-slate-200 rounded-[14px]" />
                </div>
              ))}
            </div>
          ) : filteredTests.length === 0 ? (
            
            /* ===================================================== */
            /* 6. EMPTY STATE                                        */
            /* Center Layout, Spacing, Professional Appearance       */
            /* ===================================================== */
            <div className="bg-white rounded-[18px] p-8 sm:p-12 text-center border border-slate-200/90 shadow-xs flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-3 select-none">
                📚
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                No Assessments Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                Try adjusting your search or filter selection to discover available tests.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('All Tests');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Filters</span>
              </button>
            </div>

          ) : (

            /* Assessment Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test) => {
                const diffInfo = getDifficultyInfo(test.difficulty);
                const totalQuestions = test.totalQuestions || test.q || 30;
                const durationMinutes = test.duration || test.time || 30;
                const completed = completedTests[test.slug];

                // Calculate passing score representation
                let passScoreText = 'Pass Score: 60%';
                if (test.passingMarks && totalQuestions) {
                  const passPct = Math.round((test.passingMarks / totalQuestions) * 100);
                  passScoreText = `Pass Score: ${passPct}% (${test.passingMarks} Marks)`;
                } else if (test.passingMarks) {
                  passScoreText = `Pass Score: ${test.passingMarks} Marks`;
                }

                const isStarting = startingSlug === test.slug;

                return (
                  <div
                    key={test._id || test.slug}
                    className="bg-white rounded-[18px] p-[18px] sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:border-blue-300"
                  >
                    <div>
                      {/* Top Header: Difficulty Badge + Category */}
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                        {/* 📊 Difficulty Level */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${diffInfo.badgeClass}`}>
                          {diffInfo.label}
                        </span>

                        <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 truncate max-w-[130px]">
                          {test.category || 'General'}
                        </span>
                      </div>

                      {/* 📝 Test Name */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 mb-2">
                        {test.title}
                      </h3>

                      {test.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                          {test.description}
                        </p>
                      )}

                      {/* Metadata Grid: Questions & Duration */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3.5 text-xs text-slate-700 font-medium">
                        {/* ❓ Total Questions */}
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-800">{totalQuestions} Questions</span>
                        </div>

                        {/* ⏱ Duration */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="font-semibold text-slate-800">{durationMinutes} Minutes</span>
                        </div>
                      </div>

                      {/* Status Row: Attempt Status & Passing Criteria */}
                      <div className="space-y-2 mb-4">
                        {/* 📌 Attempt Status */}
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <span className="text-xs select-none">📌</span>
                            <span>Attempt Status:</span>
                          </span>

                          {completed ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Score: {completed.score}/{totalQuestions} ({completed.percentage}%)</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 font-semibold bg-slate-200/70 px-2 py-0.5 rounded-md">
                              Not Attempted
                            </span>
                          )}
                        </div>

                        {/* 🎯 Passing Criteria */}
                        <div className="flex items-center justify-between text-xs px-2.5 py-1 text-slate-600 font-medium">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Target className="w-3.5 h-3.5 text-blue-600" />
                            <span>Passing Criteria:</span>
                          </span>
                          <span className="font-bold text-slate-800">{passScoreText}</span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTON: 🚀 Start Assessment */}
                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => handleStartTest(test.slug)}
                        disabled={isStarting}
                        className="w-full h-[50px] rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                      >
                        {isStarting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Launching Assessment...</span>
                          </>
                        ) : (
                          <>
                            <span className="select-none text-base">🚀</span>
                            <span>Start Assessment</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
