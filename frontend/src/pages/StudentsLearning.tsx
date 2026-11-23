import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Users, 
  Search, 
  BookOpen, 
  Calendar, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  GraduationCap,
  Layers,
  Award,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SanitizedStudent {
  id: string;
  displayName: string;
  initials: string;
  avatar?: string;
  learningCourse: string;
  enrolledCourses: string[];
  learningStatus: string;
  joinedMonthYear: string;
}

interface StudentsResponse {
  students: SanitizedStudent[];
  stats: {
    totalActiveStudents: number;
    totalCoursesEnrolled: number;
    totalLearningBatches: number;
    studentSuccessRate: string;
  };
  total: number;
  page: number;
  totalPages: number;
}

export default function StudentsLearning() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 9;

  const { data, isLoading, isError, refetch, isFetching } = useQuery<StudentsResponse>({
    queryKey: ['studentsLearningPublic', page, search],
    queryFn: async () => {
      const res = await axios.get('/api/statistics/students-learning', {
        params: { page, limit, search: search.trim() }
      });
      return res.data;
    },
    staleTime: 1000 * 20,
  });

  const students = data?.students || [];
  const stats = data?.stats || {
    totalActiveStudents: 0,
    totalCoursesEnrolled: 0,
    totalLearningBatches: 0,
    studentSuccessRate: '98%'
  };
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navigation Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-900 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Student Community</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Students Learning
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed max-w-2xl mx-auto font-normal">
            Meet the active learners at Easy Talk Institute building real-world fluency, conversational confidence, and career communication skills.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Public Student Showcase · Personal contact info & private records remain confidential</span>
          </div>
        </div>

        {/* 4 Statistics Cards Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5 mb-10">
          {/* Stat 1: Total Active Students */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="Students">
                👨‍🎓
              </span>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Live
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none">
                {isLoading ? '...' : stats.totalActiveStudents}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 mt-1.5 leading-snug">
                Total Active Students
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Active registered learners
              </p>
            </div>
          </div>

          {/* Stat 2: Total Courses Enrolled */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="Courses">
                📚
              </span>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                Enrolled
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none">
                {isLoading ? '...' : stats.totalCoursesEnrolled}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 mt-1.5 leading-snug">
                Total Courses Enrolled
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Active learning modules
              </p>
            </div>
          </div>

          {/* Stat 3: Total Learning Batches */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="Batches">
                🟢
              </span>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Cohorts
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none">
                {isLoading ? '...' : stats.totalLearningBatches}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 mt-1.5 leading-snug">
                Total Learning Batches
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Interactive active cohorts
              </p>
            </div>
          </div>

          {/* Stat 4: Student Success Rate */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="Success Rate">
                🏆
              </span>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                High
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none">
                {isLoading ? '...' : stats.studentSuccessRate}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 mt-1.5 leading-snug">
                Student Success Rate
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Pass & fluency progress
              </p>
            </div>
          </div>
        </div>

        {/* Search Function: Allows search by Student Name or Course Name */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search active learners by Student Name or Course Name..."
                className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-200/70 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              title="Refresh learner directory"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-2/3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Error State */
          <div className="bg-white rounded-2xl p-12 border border-red-200 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Unable to load student directory
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              A temporary issue occurred while fetching public student records from MongoDB.
            </p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-blue-900 text-white font-semibold rounded-xl text-sm hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : students.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 text-3xl">
              👨‍🎓
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {search ? 'No Matching Students Found' : 'No Active Students Yet'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {search
                ? `No active learners matched "${search}". Try searching by another student name or course.`
                : 'Active students will be showcased here once enrolled in English learning courses.'}
            </p>
            {search ? (
              <button
                onClick={handleClearSearch}
                className="px-5 py-2.5 bg-blue-900 text-white font-semibold rounded-xl text-sm hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Clear Search Filter
              </button>
            ) : (
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm hover:bg-orange-600 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Courses</span>
              </Link>
            )}
          </div>
        ) : (
          /* Responsive Card Grid */
          /* Mobile: 1 card per row (grid-cols-1) */
          /* Tablet: 2 cards per row (sm:grid-cols-2) */
          /* Desktop: 3 cards per row (lg:grid-cols-3) */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative group"
                >
                  {/* Card Top: Avatar / Initials + Student Name + Status Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.displayName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shadow-2xs shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-900 text-white ${student.avatar ? 'hidden' : 'flex'} items-center justify-center font-black text-sm shadow-xs shrink-0 border border-white/20`}
                          aria-hidden="true"
                        >
                          {student.initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-blue-900 transition-colors truncate">
                              {student.displayName}
                            </h3>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Learner" />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">
                            Easy Talk Student
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Learner</span>
                      </span>
                    </div>

                    {/* Learning Course Section */}
                    <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-100 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Learning Course</span>
                      </p>
                      <p className="font-bold text-slate-800 text-sm sm:text-base leading-snug line-clamp-2">
                        {student.learningCourse}
                      </p>

                      {student.enrolledCourses.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-200/60">
                          {student.enrolledCourses.slice(1).map((c, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200"
                            >
                              + {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Join Month & Year and Status */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-auto">
                    <div className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Joined: <strong className="text-slate-800">{student.joinedMonthYear}</strong></span>
                    </div>

                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-md">
                      Status: Active
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10">
                <p className="text-xs sm:text-sm text-slate-500">
                  Showing <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-bold text-slate-800">
                    {Math.min(page * limit, total)}
                  </span>{' '}
                  of <span className="font-bold text-slate-800">{total}</span> active learners
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    disabled={page === 1}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setPage(pageNum);
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className={`w-9 h-9 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                            page === pageNum
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    disabled={page === totalPages}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
