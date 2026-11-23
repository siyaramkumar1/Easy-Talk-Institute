import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, 
  BookOpen, 
  Clock, 
  User, 
  Globe, 
  Check, 
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleProtectedAction } from '../utils/authGuard';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import { FeaturedBatches } from '../components/batches/FeaturedBatches';
import { TestimonialCarousel } from '../components/home/TestimonialCarousel';
import { HomeStats } from '../components/home/HomeStats';
import { HomeGallery } from '../components/home/HomeGallery';

export default function Home() {
  const { settings } = useSettingsStore();
  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'public'],
    queryFn: async () => {
      const data = await courseService.getAll('Active');
      return data.slice(0, 3);
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      const timer = setTimeout(() => setMessage(''), 3000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 1. HERO BANNER SECTION (Exact Match to Reference Banner)  */}
      {/* ========================================================= */}
      <section className="relative w-full bg-gradient-to-b from-white via-slate-50/60 to-blue-50/20 overflow-hidden pt-6 sm:pt-8 md:pt-12 pb-16 sm:pb-24 md:pb-28 lg:pb-36 border-b border-slate-100/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-6 min-h-[460px] md:min-h-[520px]">
            {/* Left Column: Heading, Trophy Badge, Hindi Slogan, CTA Button */}
            <div className="lg:col-span-7 text-center lg:text-left pt-2 sm:pt-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF0E5] border border-orange-200/80 text-[#082B63] text-xs sm:text-sm font-bold shadow-2xs mb-5 select-none">
                <span className="text-base">🏆</span>
                <span>#1 Spoken English Platform in Jehanabad</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[72px] font-black text-[#082B63] tracking-tight leading-[1.08] mb-4">
                Master English<br />
                with <span className="text-[#FF6500]">Confidence</span>
              </h1>

              {/* Hindi Slogan */}
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#082B63] leading-snug mb-8 max-w-xl mx-auto lg:mx-0">
                {settings.tagline || 'अंग्रेजी बोलना सीखें, बिल्कुल Basic से Advanced तक'}
              </p>

              {/* CTA Button: Explore Courses → */}
              <div className="flex items-center justify-center lg:justify-start">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center gap-2.5 px-8 sm:px-9 py-3.5 sm:py-4 rounded-full bg-[#FF6500] hover:bg-[#e05900] active:bg-[#c44e00] text-white font-bold text-base sm:text-lg shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group cursor-pointer"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
                </Link>
              </div>
            </div>

            {/* Right Column: 3D Composition (Books, Headphones, Let's Speak Bubble, Architecture) */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[520px] lg:max-w-[620px] xl:max-w-[680px]">
                <img
                  src="/assets/hero/hero-books-headphones.png"
                  alt="Master English with Confidence - Speak English, Learn Practice Grow"
                  className="w-full h-auto object-contain drop-shadow-xl select-none pointer-events-none transform hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Swoop Wave Curves (Orange Line on Top, Dark Navy Wave Fill Below) */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-12 sm:h-16 md:h-20 lg:h-24 object-cover"
            preserveAspectRatio="none"
          >
            {/* Dark Navy Fill Wave */}
            <path
              d="M0 65C320 120 720 125 1080 85C1240 68 1360 45 1440 30V120H0V65Z"
              fill="#082B63"
            />
            {/* Orange Accent Stroke Wave */}
            <path
              d="M0 65C320 120 720 125 1080 85C1240 68 1360 45 1440 30"
              stroke="#FF6500"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. HERO STATS SECTION                                     */}
      {/* Spacing: Hero → Stats = 20px (mt-5)                       */}
      {/* 4 Cards: Students, Courses, Active Batches, Success       */}
      {/* Rounded 16px, Equal Height, Soft Shadow                   */}
      {/* ========================================================= */}
      <div className="mt-5">
        <HomeStats />
      </div>

      {/* ========================================================= */}
      {/* 3. BATCHES SECTION                                        */}
      {/* Spacing: Stats → Batches = 24px (mt-6)                    */}
      {/* Larger Cards, 🟢 Active or 🟡 Upcoming, Trainer, Date,    */}
      {/* Time, Seats Filled/Available, Join Now / Reserve Seat     */}
      {/* ========================================================= */}
      <div className="mt-6">
        <FeaturedBatches />
      </div>

      {/* ========================================================= */}
      {/* 4. SMART LEARNING FEATURES                                */}
      {/* Spacing: Batches → Features = 24px (mt-6)                 */}
      {/* Cards: Reading, Speaking, English Assessment, Progress    */}
      {/* Card Gap: 16px (gap-4)                                    */}
      {/* ========================================================= */}
      <section className="mt-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Learning Lab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Smart Learning Features
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-1 max-w-xl">
            Practical learning resources designed to build your reading comprehension, assessment readiness, course mastery, and live cohort confidence.
          </p>
        </div>

        {/* 4 Primary Real Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 📖 Reading Practice */}
          <div className="bg-white rounded-[18px] p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-orange-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                <span role="img" aria-label="reading">📖</span>
              </div>
              <span className="text-[11px] font-bold text-orange-600 tracking-wider uppercase mb-1 block">
                Bilingual Stories
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                Reading Practice
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                Improve English reading skills through beginner to advanced bilingual stories.
              </p>
            </div>
            <Link
              to="/reading"
              className="w-full py-2.5 px-4 rounded-xl bg-orange-50 group-hover:bg-orange-500 group-hover:text-white text-orange-700 font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Start Reading</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 2: 📝 English Assessment Test */}
          <div className="bg-white rounded-[18px] p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                <span role="img" aria-label="assessment">📝</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 tracking-wider uppercase mb-1 block">
                Quizzes & Evaluation
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                English Assessment Test
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                Take institute assessments and evaluate learning progress.
              </p>
            </div>
            <Link
              to="/tests"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-700 font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Take Assessment</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 3: 📚 Professional Courses */}
          <div className="bg-white rounded-[18px] p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                <span role="img" aria-label="courses">📚</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase mb-1 block">
                Structured Curriculum
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                Professional Courses
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                Learn Spoken English, Communication Skills and Interview Preparation.
              </p>
            </div>
            <Link
              to="/courses"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-700 font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 4: 🗓 Live Learning Batches */}
          <div className="bg-white rounded-[18px] p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                <span role="img" aria-label="batches">🗓️</span>
              </div>
              <span className="text-[11px] font-bold text-purple-600 tracking-wider uppercase mb-1 block">
                Interactive Cohorts
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                Live Learning Batches
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                Join active and upcoming instructor-led batches.
              </p>
            </div>
            <Link
              to="/batches"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-50 group-hover:bg-purple-600 group-hover:text-white text-purple-700 font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer"
            >
              <span>View Batches</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. POPULAR COURSES SECTION                                */}
      {/* Spacing: Features → Courses = 28px (mt-7)                 */}
      {/* Image, Badge, Duration, Trainer, Language, 3-line desc,   */}
      {/* View Details, Enroll Now, Rounded 20px, Equal Height      */}
      {/* ========================================================= */}
      <section className="mt-7 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-200">
              <BookOpen className="w-3.5 h-3.5 text-orange-600" />
              <span>Curated Curriculum</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular Programs & Courses
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-1 max-w-xl">
              Transform your fluency with practical spoken English, interview training, and personality development programs.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/80 px-4 py-2.5 rounded-xl border border-blue-200/60 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>View All Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Course Cards Grid: Rounded 20px, Equal Height, Clean Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(courses) ? courses : []).map((course, idx) => {
            const courseSlug = course.slug || course.title?.toLowerCase().replace(/\s+/g, '-');
            const courseImage = course.thumbnail?.url || course.thumbnail || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
            const courseLevel = course.level || 'All Levels';
            const courseCategory = course.category || 'Spoken English';

            return (
              <div
                key={course._id || idx}
                className="bg-white rounded-[20px] overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:border-blue-300"
              >
                <div>
                  {/* Course Image */}
                  <Link
                    to={`/course/${courseSlug}`}
                    className="h-44 sm:h-48 overflow-hidden relative block cursor-pointer bg-slate-100"
                  >
                    <img
                      src={courseImage}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-blue-900 shadow-xs border border-white">
                        {courseCategory}
                      </span>
                    </div>
                    {courseLevel && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {courseLevel}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    {/* Course Title */}
                    <Link to={`/course/${courseSlug}`}>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                        {course.title}
                      </h3>
                    </Link>

                    {/* Metadata Strip: Duration, Trainer, Language */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50/90 rounded-xl border border-slate-100 mb-3 text-[11px] font-medium text-slate-600">
                      {/* Duration */}
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{course.duration || 'Flexible'}</span>
                      </div>

                      {/* Trainer */}
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="truncate">{course.instructor || 'Siyaram Kumar'}</span>
                      </div>

                      {/* Language */}
                      <div className="flex items-center gap-1.5 truncate">
                        <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{course.language || 'Hindi/English'}</span>
                      </div>
                    </div>

                    {/* Short Description: Max 3 lines, no text overflow */}
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3 mb-2">
                      {course.shortDescription || course.description || 'Master English speaking, structured grammar, active vocabulary, and communication drills.'}
                    </p>
                  </div>
                </div>

                {/* Buttons: View Details & Enroll Now */}
                <div className="p-4 sm:p-5 pt-0 mt-auto flex gap-2">
                  <Link
                    to={`/course/${courseSlug}`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm text-center transition-colors cursor-pointer"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() =>
                      handleProtectedAction(navigate, `/enroll/${courseSlug}`, {
                        courseTitle: course.title,
                      })
                    }
                    className="flex-1 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm text-center transition-colors shadow-xs cursor-pointer"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. GALLERY SECTION                                        */}
      {/* Spacing: Courses → Gallery = 28px (mt-7)                  */}
      {/* Showcase Cards, Category Badge, Date, Title, Description  */}
      {/* ========================================================= */}
      <div className="mt-7">
        <HomeGallery />
      </div>

      {/* ========================================================= */}
      {/* 7. TESTIMONIAL SECTION                                    */}
      {/* Spacing: Gallery → Testimonials = 28px (mt-7)             */}
      {/* Testimonials → Footer = 32px (mb-8)                       */}
      {/* Rating, Photo/Avatar, Name, Course, Review, Achievement   */}
      {/* ========================================================= */}
      <div className="mt-7 mb-8">
        <TestimonialCarousel />
      </div>
    </div>
  );
}
