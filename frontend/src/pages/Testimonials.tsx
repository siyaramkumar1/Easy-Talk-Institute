import React, { useState } from 'react';
import { 
  Quote, 
  Star, 
  PlayCircle, 
  CheckCircle, 
  Filter, 
  Trophy, 
  Video, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { testimonialService } from '../services/testimonialService';
import { statisticService } from '../services/statisticService';

// Helper to compute initials like "SK", "AK", "PK"
const getInitials = (name: string): string => {
  if (!name) return 'ET';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Testimonials() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const itemsPerPage = 6;

  const { data: stats = [] } = useQuery({ 
    queryKey: ['statistics', 'testimonials'], 
    queryFn: () => statisticService.getStatistics({ section: 'testimonials', status: 'Active' }) 
  });

  const { data: testimonials = [], isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['testimonials', 'active'],
    queryFn: () => testimonialService.getTestimonials({ status: 'Active' })
  });

  const safeStats = Array.isArray(stats) ? stats : [];
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];

  const featured = safeTestimonials.find(t => t.featured);
  
  // Filter by category / rating AND search query
  const filteredTestimonials = safeTestimonials.filter(t => {
    // Exclude featured from general list if filter is 'All'
    if (filter === 'All' && featured && t._id === featured._id) {
      return false;
    }

    // Filter check
    if (filter === 'Highest Rated' && t.rating !== 5) {
      return false;
    }
    if (filter !== 'All' && filter !== 'Highest Rated') {
      const courseMatch = (t.courseName || '').toLowerCase().includes(filter.toLowerCase());
      if (!courseMatch) return false;
    }

    // Search check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = (t.studentName || '').toLowerCase().includes(q);
      const matchesCourse = (t.courseName || '').toLowerCase().includes(q);
      const matchesTitle = (t.reviewTitle || '').toLowerCase().includes(q);
      const matchesMsg = (t.reviewMessage || '').toLowerCase().includes(q);
      if (!matchesName && !matchesCourse && !matchesTitle && !matchesMsg) {
        return false;
      }
    }

    return true;
  });

  // Pagination calculation
  const total = filteredTestimonials.length;
  const totalPages = Math.ceil(total / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedTestimonials = filteredTestimonials.slice(startIndex, startIndex + itemsPerPage);

  const toggleExpand = (id: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/70 via-white to-slate-50 min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full bg-amber-100/80 text-amber-800 font-bold text-xs uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Real Student Reviews & Results</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-950 mb-4 tracking-tight">
            Student Success Stories
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Discover how Easy Talk Institute's Spoken English and Placement Guidance classes have helped students overcome language barriers and speak with confidence.
          </p>
          
          {/* Key Metrics Strip */}
          <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto text-slate-700 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
            {safeStats.length > 0 ? safeStats.map((stat, idx) => (
              <div key={stat._id} className={`text-center px-4 ${idx > 0 ? 'border-l border-slate-200' : ''}`}>
                <div className="text-2xl sm:text-3xl font-black text-blue-900">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            )) : (
              <div className="text-center text-slate-500 text-sm">
                Approved student reviews recorded live in MongoDB.
              </div>
            )}
          </div>
        </div>

        {isError ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-red-200 max-w-md mx-auto p-8 shadow-xs">
            <h3 className="text-lg font-bold text-red-600 mb-2">Unable to load reviews</h3>
            <p className="text-slate-500 text-sm mb-4">A temporary error occurred while fetching success stories.</p>
            <button onClick={() => refetch()} className="px-5 py-2.5 bg-blue-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-slate-500 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900 mb-3" />
            <p className="text-sm font-medium">Loading student reviews...</p>
          </div>
        ) : safeTestimonials.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto p-8 shadow-xs">
            <Quote className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Testimonials Yet</h3>
            <p className="text-slate-500 text-sm">Student reviews will appear here once approved by the administrator.</p>
          </div>
        ) : (
          <>
            {/* Featured Testimonial Highlight */}
            {featured && !searchQuery && filter === 'All' && (
              <div className="bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900 rounded-3xl overflow-hidden shadow-xl mb-12 flex flex-col lg:flex-row relative border border-blue-900">
                <div className="lg:w-1/2 p-8 sm:p-10 lg:p-14 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-amber-400 text-slate-900 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Featured Story
                    </span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < (featured.rating || 5) ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'}`} />
                      ))}
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
                    "{featured.reviewTitle}"
                  </h2>
                  <p className="text-blue-100 text-sm sm:text-base mb-6 italic leading-relaxed">
                    "{featured.reviewMessage}"
                  </p>
                  
                  {featured.achievement && (
                    <div className="bg-blue-900/60 p-3.5 rounded-xl mb-6 border border-blue-800 flex items-center gap-2.5">
                      <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Achievement</p>
                        <p className="text-white font-semibold text-xs sm:text-sm">{featured.achievement}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3.5">
                    {(() => {
                      const photoUrl = featured.studentPhoto?.imageUrl || featured.studentPhoto?.url || featured.imageUrl || (typeof featured.studentPhoto === 'string' ? featured.studentPhoto : '');
                      return (
                        <>
                          {photoUrl ? (
                            <img 
                              src={photoUrl} 
                              alt={featured.studentName} 
                              className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shrink-0" 
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-100 text-amber-800 ${photoUrl ? 'hidden' : 'flex'} items-center justify-center font-black text-base shrink-0`} 
                          >
                            {getInitials(featured.studentName)}
                          </div>
                        </>
                      );
                    })()}
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5 text-base">
                        {featured.studentName}
                        {featured.verified && <CheckCircle className="w-4 h-4 text-green-400" title="Verified Student" />}
                      </p>
                      <p className="text-blue-200 text-xs">{featured.courseName} {featured.batchName && `• ${featured.batchName}`}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-1/2 relative bg-slate-900 min-h-[260px] lg:min-h-full">
                  <img 
                    src={featured.studentPhoto?.imageUrl || featured.studentPhoto?.url || featured.imageUrl || (typeof featured.studentPhoto === 'string' ? featured.studentPhoto : '') || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'}
                    alt="Success Story" 
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-blue-950 via-blue-950/40 to-transparent" />
                  {featured.videoUrl && (
                     <a href={featured.videoUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                       <div className="w-16 h-16 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <PlayCircle className="w-10 h-10 text-white" />
                       </div>
                     </a>
                  )}
                </div>
              </div>
            )}

            {/* Search and Filters Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search reviews by student name, message, or course..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-200/70 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                {['All', 'Highest Rated', 'Spoken English', 'Placement Guidance'].map(f => (
                  <button 
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      filter === f 
                        ? 'bg-blue-900 text-white shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count Banner */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                Showing <span className="font-bold text-slate-900">{total}</span> approved review{total !== 1 ? 's' : ''}
              </p>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                ⭐ {safeTestimonials.length > 0 ? `${safeTestimonials.length}+ Verified Stories` : '0 Reviews'}
              </span>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {paginatedTestimonials.map((t) => {
                const photoUrl = t.studentPhoto?.imageUrl || t.studentPhoto?.url || t.imageUrl || (typeof t.studentPhoto === 'string' ? t.studentPhoto : '');
                const isExpanded = !!expandedReviews[t._id];
                const msg = t.reviewMessage || '';
                const isLong = msg.length > 150;
                const displayMsg = isExpanded || !isLong ? msg : `${msg.slice(0, 150)}...`;

                return (
                  <div 
                    key={t._id} 
                    className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 relative flex flex-col h-full group hover:-translate-y-1"
                  >
                    <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-100 group-hover:text-blue-50 transition-colors pointer-events-none" />
                    
                    {/* Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < (t.rating || 5) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} 
                        />
                      ))}
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-blue-950 text-base sm:text-lg mb-2 relative z-10 line-clamp-1">
                      {t.reviewTitle || 'Outstanding Experience'}
                    </h3>

                    {/* Review text with Read More */}
                    <div className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed relative z-10 flex-grow">
                      <span>"{displayMsg}"</span>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(t._id)}
                          className="ml-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 underline inline-block cursor-pointer"
                        >
                          {isExpanded ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                    
                    {/* Achievement Tag */}
                    {t.achievement && (
                      <div className="bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold mb-4 mt-auto border border-emerald-100 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{t.achievement}</span>
                      </div>
                    )}

                    {/* Video Review Link */}
                    {t.videoUrl && (
                      <a 
                        href={t.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1.5 text-blue-600 font-semibold text-xs mb-4 mt-auto hover:text-orange-500 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" /> 
                        <span>Watch Video Review</span>
                      </a>
                    )}

                    {/* Author Footer */}
                    <div className="flex items-center gap-3.5 mt-auto border-t border-slate-100 pt-4">
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt={t.studentName} 
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs" 
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-11 h-11 rounded-full bg-blue-100 text-blue-800 ${photoUrl ? 'hidden' : 'flex'} items-center justify-center font-bold text-sm shrink-0`} 
                      >
                        {getInitials(t.studentName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1 text-sm truncate">
                          <span className="truncate">{t.studentName}</span>
                          {t.verified && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" title="Verified Student" />}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                          <span className="truncate text-slate-500 font-medium">{t.courseName || 'Spoken English'}</span>
                          <span className="shrink-0">{new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {paginatedTestimonials.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200 p-8">
                  No reviews match your search or filter criteria.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10">
                <p className="text-xs sm:text-sm text-slate-500">
                  Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{' '}
                  <span className="font-bold text-slate-800">
                    {Math.min(startIndex + itemsPerPage, total)}
                  </span>{' '}
                  of <span className="font-bold text-slate-800">{total}</span> reviews
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
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
                            window.scrollTo({ top: 400, behavior: 'smooth' });
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
                      window.scrollTo({ top: 400, behavior: 'smooth' });
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
            
            {/* Student Success Wall Banner */}
            <div className="mt-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 sm:p-10 text-center text-white shadow-lg relative overflow-hidden">
               <h3 className="text-2xl sm:text-3xl font-black mb-2 relative z-10">
                 Student Success Wall
               </h3>
               <p className="text-orange-50 text-sm sm:text-base mb-6 max-w-xl mx-auto relative z-10 font-normal">
                 Join our wall of achievers by practicing daily, graduating with distinction, and unlocking career growth!
               </p>
               <div className="flex flex-wrap justify-center gap-3 relative z-10 text-xs sm:text-sm font-bold">
                  <span className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20">Top Performers</span>
                  <span className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20">Best Communicators</span>
                  <span className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20">Highest Attendance</span>
                  <span className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20">Placement Achievers</span>
               </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
