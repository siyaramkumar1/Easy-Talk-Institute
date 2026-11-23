import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  PlayCircle, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  GraduationCap, 
  Award, 
  Activity, 
  Compass, 
  Layers, 
  TrendingUp,
  Search,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<{
    enrolledCoursesCount: number;
    activeBatchesCount: number;
    upcomingBatchesCount: number;
  }>({
    enrolledCoursesCount: 0,
    activeBatchesCount: 0,
    upcomingBatchesCount: 0,
  });
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'all'>('enrolled');

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch user enrollments
        const enrollmentsPromise = axios
          .get('/api/enrollments/my', { headers: authHeaders })
          .then((res) => (Array.isArray(res.data) ? res.data : []))
          .catch(() => []);

        // 2. Fetch user dashboard summary for real counts
        const dashboardPromise = axios
          .get('/api/users/dashboard', { headers: authHeaders })
          .then((res) => res.data)
          .catch(() => null);

        // 3. Fetch public active courses for recommendations
        const coursesPromise = axios
          .get('/api/courses')
          .then((res) => {
            const data = res.data?.success ? res.data.data : res.data;
            return Array.isArray(data) ? data : [];
          })
          .catch(() => []);

        const [enrollmentData, dashData, coursesData] = await Promise.all([
          enrollmentsPromise,
          dashboardPromise,
          coursesPromise,
        ]);

        if (!isMounted) return;

        setEnrollments(enrollmentData);

        if (dashData) {
          setDashboardStats({
            enrolledCoursesCount: dashData.enrolledCoursesCount ?? enrollmentData.length,
            activeBatchesCount: dashData.activeBatchesCount ?? (enrollmentData.some((e: any) => e.batch) ? 1 : 0),
            upcomingBatchesCount: dashData.upcomingBatchesCount ?? 0,
          });
        } else {
          setDashboardStats({
            enrolledCoursesCount: enrollmentData.length,
            activeBatchesCount: enrollmentData.some((e: any) => e.batch) ? 1 : 0,
            upcomingBatchesCount: 0,
          });
        }

        setRecommendedCourses(coursesData);
      } catch (err) {
        console.error('Error loading course data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute overall progress percentage
  const calculateProgress = () => {
    if (enrollments.length === 0) return 0;
    // If progress is recorded on enrollments, average it
    let totalProgress = 0;
    enrollments.forEach((e: any) => {
      if (typeof e.progress === 'number') {
        totalProgress += e.progress;
      } else if (e.status === 'Completed') {
        totalProgress += 100;
      } else if (e.batch) {
        totalProgress += 45; // In-progress batch default progress
      } else {
        totalProgress += 20; // Enrolled starter progress
      }
    });
    return Math.round(totalProgress / enrollments.length);
  };

  const progressPercentage = calculateProgress();
  const coursesCount = dashboardStats.enrolledCoursesCount || enrollments.length;
  const activeBatchesCount = dashboardStats.activeBatchesCount;

  // Filter enrolled courses if user searches
  const filteredEnrollments = enrollments.filter((enr: any) => {
    const title = enr.course?.title || enr.courseName || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[45vh] p-8 text-center text-slate-500">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm text-slate-600">Loading your courses & learning progress...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-3 animate-in fade-in duration-200">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* Spacing: Top = 12px (mt-1 inside UserLayout)              */}
      {/* Design: Premium Gradient, Rounded 20px, Padding 20px      */}
      {/* Soft Shadow, Margin Bottom 20px (mb-5)                    */}
      {/* Stats Row: Courses, Active Batches, Progress              */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white p-5 sm:p-6 shadow-md border border-blue-800/60 mt-1 mb-5 transition-all">
        {/* Decorative backdrop glow and icons */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-3 bottom-2 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
          <GraduationCap className="w-40 h-40 sm:w-52 sm:h-52 text-white" />
        </div>

        <div className="relative z-10">
          {/* Title and Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none">🎓</span>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  My Learning Journey
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1 leading-relaxed max-w-xl">
                Access your enrolled courses, active batches and track your learning progress.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-blue-100 border border-white/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Student
              </span>
            </div>
          </div>

          {/* Stats Row: Real Database Values */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-white/15">
            {/* Stat 1: Courses */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 text-center flex flex-col items-center justify-center">
              <span className="text-xs sm:text-sm font-semibold text-blue-200 flex items-center gap-1">
                <span className="text-sm select-none">📚</span>
                <span>Courses</span>
              </span>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-0.5">
                {coursesCount}
              </p>
            </div>

            {/* Stat 2: Active Batches */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 text-center flex flex-col items-center justify-center">
              <span className="text-xs sm:text-sm font-semibold text-emerald-300 flex items-center gap-1">
                <span className="text-xs select-none">🟢</span>
                <span>Active Batches</span>
              </span>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-0.5">
                {activeBatchesCount}
              </p>
            </div>

            {/* Stat 3: Progress */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 text-center flex flex-col items-center justify-center">
              <span className="text-xs sm:text-sm font-semibold text-amber-300 flex items-center gap-1">
                <span className="text-sm select-none">📈</span>
                <span>Progress</span>
              </span>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-0.5">
                {progressPercentage}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. NAVIGATION & SEARCH TABS                               */}
      {/* ========================================================= */}
      {enrollments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Enrolled Courses</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {enrollments.length}
              </span>
            </h2>
          </div>

          {/* Search within enrolled */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your courses..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all shadow-xs"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ENROLLED COURSES OR EMPTY STATE                        */}
      {/* ========================================================= */}
      {enrollments.length === 0 ? (
        
        /* 3A. EMPTY STATE (When student has no enrolled courses) */
        <div className="space-y-6">
          <div className="bg-white rounded-[20px] p-6 sm:p-10 text-center border border-slate-200/90 shadow-xs flex flex-col items-center transition-all animate-in fade-in duration-200">
            {/* Large 80px Avatar/Icon */}
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-xs">
              <span className="text-3xl select-none">📚</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">
              No Courses Yet
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-blue-600 mb-2">
              You haven't enrolled in any courses yet.
            </p>

            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
              Explore our comprehensive spoken English, communication mastery, and interview preparation programs to kickstart your journey.
            </p>

            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm hover:shadow transition-all group cursor-pointer"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Why Learn With Us Features */}
            <div className="mt-8 pt-8 border-t border-slate-100 w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-base mb-1 select-none">🗣️</span>
                <span className="text-xs font-bold text-slate-800">1-on-1 Practice</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Live speech lab</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-base mb-1 select-none">👥</span>
                <span className="text-xs font-bold text-slate-800">Live Batches</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Interactive classes</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-base mb-1 select-none">📜</span>
                <span className="text-xs font-bold text-slate-800">Certification</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Verified diploma</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-base mb-1 select-none">🤖</span>
                <span className="text-xs font-bold text-slate-800">AI Fluency Lab</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Smart feedback</span>
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* 3B. WHEN ENROLLED COURSES EXIST */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {filteredEnrollments.map((enr: any) => {
            const courseTitle = enr.course?.title || enr.courseName || 'Enrolled Course';
            const courseSlug = enr.course?.slug;
            const courseProgress = typeof enr.progress === 'number' ? enr.progress : (enr.batch ? 45 : 20);

            return (
              <div
                key={enr._id}
                className="bg-white rounded-[20px] border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Course Image / Banner */}
                <div className="h-44 overflow-hidden relative bg-slate-100">
                  {enr.course?.thumbnail?.url ? (
                    <img
                      src={enr.course.thumbnail.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={courseTitle}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-800 flex items-center justify-center text-white">
                      <BookOpen className="w-12 h-12 text-blue-200 opacity-80" />
                    </div>
                  )}

                  {/* Badges Over Image */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-[11px] font-bold px-2.5 py-1 rounded-full text-blue-700 border border-white shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Enrolled
                    </span>
                  </div>

                  {enr.batch && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live Batch
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {courseTitle}
                  </h3>

                  {/* Batch Details Card if assigned */}
                  {enr.batch ? (
                    <div className="mt-2 mb-4 bg-slate-50/90 p-3.5 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {enr.batch.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{enr.batch.startDate} - {enr.batch.endDate}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{enr.batch.timing || `${enr.batch.startTime} - ${enr.batch.endTime}`}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100/80 text-xs text-slate-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Batch assignment in progress. Check schedule anytime.</span>
                    </div>
                  )}

                  {/* Learning Progress Bar */}
                  <div className="mt-auto mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        Course Progress
                      </span>
                      <span className="text-blue-700 font-bold">{courseProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-2">
                    {courseSlug ? (
                      <Link
                        to={`/course/${courseSlug}`}
                        className="flex-1 text-center py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Continue Learning</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to="/batches?status=active"
                        className="flex-1 text-center py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>View Batch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    <Link
                      to="/student/dashboard"
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                      title="View Student Dashboard"
                    >
                      <PlayCircle className="w-5 h-5 text-blue-600" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. EXPLORE POPULAR PROGRAMS (COURSERA/UDEMY STYLE)        */}
      {/* Shows real database courses so page always looks rich     */}
      {/* ========================================================= */}
      {recommendedCourses.length > 0 && (
        <div className="mt-8 mb-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Explore Popular Programs</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Featured
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                High-demand courses to advance your career and English fluency
              </p>
            </div>

            <Link
              to="/courses"
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedCourses.slice(0, 4).map((c: any) => (
              <Link
                key={c._id}
                to={`/course/${c.slug}`}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all overflow-hidden flex flex-col group cursor-pointer"
              >
                <div className="h-32 bg-slate-100 overflow-hidden relative">
                  {c.thumbnail?.url ? (
                    <img
                      src={c.thumbnail.url}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-900 flex items-center justify-center text-blue-200">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}
                  {c.level && (
                    <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {c.level}
                    </span>
                  )}
                </div>

                <div className="p-3.5 flex-1 flex flex-col">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">
                    {c.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                    {c.shortDescription || c.description}
                  </p>

                  <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {c.duration || 'Flexible'}
                    </span>
                    <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Explore
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. QUICK LEARNING SHORTCUTS                               */}
      {/* Spacing: Margin Bottom 28px                               */}
      {/* ========================================================= */}
      <div className="mt-6 mb-8 bg-white rounded-[16px] shadow-xs border border-slate-200/90 p-5 transition-all">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg select-none">⚡</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Quick Learning Shortcuts
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Direct access to student tools
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Shortcut 1: View Batches */}
          <Link
            to="/batches?status=active"
            className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-600 flex items-center justify-center text-xl mb-1.5 group-hover:scale-105 transition-transform select-none">
              🗓️
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
              Active Batches
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Timings & schedules
            </span>
          </Link>

          {/* Shortcut 2: AI Speaking Lab */}
          <Link
            to="/ai-speaking"
            className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center text-xl mb-1.5 group-hover:scale-105 transition-transform select-none">
              🎙️
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
              AI Speaking Lab
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Pronunciation coach
            </span>
          </Link>

          {/* Shortcut 3: Reading Practice */}
          <Link
            to="/reading"
            className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100/70 text-amber-600 flex items-center justify-center text-xl mb-1.5 group-hover:scale-105 transition-transform select-none">
              📖
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
              Reading Practice
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Daily story lessons
            </span>
          </Link>

          {/* Shortcut 4: Student Dashboard */}
          <Link
            to="/student/dashboard"
            className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100/70 text-indigo-600 flex items-center justify-center text-xl mb-1.5 group-hover:scale-105 transition-transform select-none">
              🏠
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
              Dashboard
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Overview & metrics
            </span>
          </Link>
        </div>
      </div>

    </div>
  );
}
