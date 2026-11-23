import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  Clock, 
  Users, 
  ArrowRight, 
  Shield, 
  Globe, 
  Search, 
  Filter, 
  Tag, 
  CheckCircle,
  IndianRupee,
  Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { handleProtectedAction } from '../utils/authGuard';
import { courseService } from '../services/courseService';
import { usePublicBatches } from '../hooks/useBatches';
import { optimizeImageUrl } from '../utils/imageOptimizer';

export default function Courses() {
  const navigate = useNavigate();
  const { batches } = usePublicBatches();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');

  const { data: courses = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['courses', 'public'],
    queryFn: async () => {
      return await courseService.getAll('Active');
    }
  });

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = (Array.isArray(courses) ? courses : []).filter((course) => {
    const matchesSearch = 
      (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.instructor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.shortDescription || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = 
      selectedLevel === 'All' || 
      (course.level || '').toLowerCase() === selectedLevel.toLowerCase();

    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="py-20 flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900 mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading available courses from database...</p>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 text-orange-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Master Spoken English</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-950 mb-3 tracking-tight">
            Our Available Courses
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Choose from our professionally structured English modules, grammar workshops, and placement communication programs.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search courses by name, topic, or trainer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-200/70 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Level Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Level:
            </span>
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count Banner */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            Showing <span className="font-bold text-slate-900">{filteredCourses.length}</span> active course{filteredCourses.length !== 1 ? 's' : ''}
          </p>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ● Real-time Live Catalog
          </span>
        </div>
        
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-10 max-w-xl mx-auto text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Matching Courses Found</h3>
            <p className="text-slate-500 text-sm mb-6">
              {searchQuery || selectedLevel !== 'All'
                ? 'Try adjusting your search keywords or filter criteria to see available courses.'
                : 'Active courses published by the administrator will automatically display here.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {(searchQuery || selectedLevel !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLevel('All');
                  }}
                  className="px-5 py-2.5 bg-blue-900 text-white font-semibold rounded-xl text-sm hover:bg-blue-800 transition-colors"
                >
                  Reset Filters
                </button>
              )}
              <Link 
                to="/batches" 
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                View Batches
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCourses.map((course, idx) => {
              const rawImageSrc = 
                course.thumbnailUrl || 
                course.thumbnail?.url || 
                course.imageUrl || 
                (typeof course.thumbnail === 'string' ? course.thumbnail : '') || 
                'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
              const imageSrc = optimizeImageUrl(rawImageSrc, 600);

              const priceValue = course.discountPrice || course.price;
              const formattedPrice = priceValue ? `₹${priceValue.toLocaleString('en-IN')}` : 'Free';
              const enrolledCount = course.enrolledStudents || 0;
              const trainerName = course.instructor || 'Siyaram Kumar';

              const courseBatches = batches.filter((b: any) => b.course?.title === course.title);
              const activeBatchCount = courseBatches.filter((b: any) => b.status === 'Active').length;

              return (
                <div 
                  key={course._id || idx} 
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-slate-300 hover:shadow-xl transition-all duration-300 group flex flex-col hover:-translate-y-1 relative"
                >
                  {/* Course Image Header */}
                  <Link 
                    to={`/course/${course.slug || course.title.toLowerCase().replace(/ /g, '-')}`} 
                    className="h-52 overflow-hidden relative block cursor-pointer group"
                  >
                    <img 
                      src={imageSrc} 
                      alt={course.title} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    
                    {/* Floating Status & Level Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="text-[11px] bg-emerald-600/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-full font-bold tracking-wide flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Active
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20">
                        <Shield className="w-3 h-3 text-orange-400" /> {course.level || 'All Levels'}
                      </span>
                    </div>

                    {/* Fees Tag in bottom overlay */}
                    <div className="absolute bottom-3 left-3 text-white flex items-center gap-2">
                      <div className="text-xl font-black text-amber-300">
                        {formattedPrice}
                      </div>
                      {course.discountPrice && course.price && course.price > course.discountPrice && (
                        <span className="text-xs text-slate-300 line-through">
                          ₹{course.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  {/* Card Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <Link to={`/course/${course.slug || course.title.toLowerCase().replace(/ /g, '-')}`}>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-1 cursor-pointer">
                        {course.title}
                      </h3>
                    </Link>
                    
                    <p className="text-slate-600 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
                      {course.shortDescription || course.description || 'Master practical English and enhance communication with guided mentor coaching.'}
                    </p>
                    
                    {/* Course Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate" title={`Trainer: ${trainerName}`}>
                          {trainerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">
                          {course.duration || '8 Weeks'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">
                          {course.language || 'English / Hindi'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="font-bold text-purple-700 truncate">
                          {enrolledCount} Enrolled
                        </span>
                      </div>
                    </div>

                    {/* Active Batches Indicator */}
                    {activeBatchCount > 0 && (
                      <div className="mb-4">
                        <span className="text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {activeBatchCount} Active Cohort Running
                        </span>
                      </div>
                    )}
                    
                    {/* Action Buttons: View Details & Enroll Now */}
                    <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 mt-auto">
                      <Link 
                        to={`/course/${course.slug || course.title.toLowerCase().replace(/ /g, '-')}`} 
                        className="flex-1 text-center bg-white border border-slate-300 text-slate-700 font-bold py-2.5 px-3 rounded-xl hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900 transition-all text-xs sm:text-sm cursor-pointer"
                      >
                        View Details
                      </Link>

                      <button 
                        onClick={() => handleProtectedAction(navigate, `/enroll/${course._id}`, { courseTitle: course.title })}
                        className="flex-1 text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm hover:shadow text-xs sm:text-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Enroll</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
