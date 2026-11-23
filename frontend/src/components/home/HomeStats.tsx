import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowUpRight } from 'lucide-react';

interface LiveStatsResponse {
  totalStudents: number;
  activeBatches: number;
  upcomingBatches: number;
  completedBatches: number;
  averageRating: number;
  reviewCount: number;
  successRate: number;
  totalCourses: number;
  hasData: boolean;
}

export const HomeStats: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading, isError } = useQuery<LiveStatsResponse>({
    queryKey: ['homeLiveStats'],
    queryFn: async () => {
      const res = await axios.get('/api/statistics/live');
      return res.data;
    },
    staleTime: 1000 * 15, // 15s refresh
    refetchOnWindowFocus: true,
  });

  const totalStudents = stats?.totalStudents ?? 0;
  const totalCourses = stats?.totalCourses ?? 0;
  const activeBatches = stats?.activeBatches ?? 0;
  const reviewCount = stats?.reviewCount ?? 0;

  // Format success stories as 1+, 10+, 50+, 100+ or 0
  const formatSuccessStories = (count: number) => {
    if (count <= 0) return '0';
    return `${count}+`;
  };

  const statCards = [
    {
      id: 'students-learning',
      title: 'Students Learning',
      sublabel: 'Active registered learners',
      displayValue: isLoading ? null : `${totalStudents}`,
      emoji: '👨‍🎓',
      path: '/students-learning',
      ariaLabel: `View active students learning, current total ${totalStudents}`,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      dotColor: 'bg-blue-500',
      borderHover: 'hover:border-blue-300 hover:shadow-blue-500/10',
      activeRing: 'focus-visible:ring-blue-500',
      accentColor: 'group-hover:text-blue-600',
    },
    {
      id: 'courses-available',
      title: 'Courses Available',
      sublabel: 'Basic to advanced modules',
      displayValue: isLoading ? null : `${totalCourses}`,
      emoji: '📚',
      path: '/courses',
      ariaLabel: `View available courses, current total ${totalCourses}`,
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      dotColor: 'bg-orange-500',
      borderHover: 'hover:border-orange-300 hover:shadow-orange-500/10',
      activeRing: 'focus-visible:ring-orange-500',
      accentColor: 'group-hover:text-orange-600',
    },
    {
      id: 'active-batches',
      title: 'Active Batches',
      sublabel: 'Live interactive cohorts',
      displayValue: isLoading ? null : `${activeBatches}`,
      emoji: '🟢',
      path: '/batches?status=active',
      ariaLabel: `View active learning batches, current total ${activeBatches}`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      borderHover: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
      activeRing: 'focus-visible:ring-emerald-500',
      accentColor: 'group-hover:text-emerald-600',
    },
    {
      id: 'success-stories',
      title: 'Success Stories',
      sublabel: 'Student reviews & results',
      displayValue: isLoading ? null : formatSuccessStories(reviewCount),
      emoji: '🏆',
      path: '/testimonials',
      ariaLabel: `View student success stories, current total ${reviewCount}`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      borderHover: 'hover:border-amber-300 hover:shadow-amber-500/10',
      activeRing: 'focus-visible:ring-amber-500',
      accentColor: 'group-hover:text-amber-600',
    },
  ];

  const handleCardClick = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  return (
    <section 
      aria-label="Institute Live Statistics" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {statCards.map((card) => (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(card.path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(card.path);
              }
            }}
            aria-label={card.ariaLabel}
            className={`
              group relative bg-white rounded-2xl p-4 sm:p-5 md:p-6
              border border-slate-200/90 ${card.borderHover}
              shadow-xs hover:shadow-xl
              transition-all duration-300 ease-out
              transform hover:-translate-y-1.5 active:scale-[0.98]
              cursor-pointer select-none flex flex-col justify-between h-full
              focus:outline-none ${card.activeRing} focus-visible:ring-2 focus-visible:ring-offset-2
            `}
          >
            {/* Top row: Emoji & Live badge + subtle arrow indicator */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span 
                className="text-2xl sm:text-3xl md:text-4xl transform group-hover:scale-110 transition-transform duration-300 select-none" 
                role="img" 
                aria-hidden="true"
              >
                {card.emoji}
              </span>
              
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full border ${card.badgeColor} shadow-2xs`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor} animate-pulse`} />
                  Live
                </span>
                
                <span className="w-5 h-5 rounded-full bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </div>

            {/* Bottom row: Value, Title, Sublabel */}
            <div className="flex-1 flex flex-col justify-end mt-2">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-8 sm:h-9 w-20 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-36 bg-slate-50 rounded animate-pulse" />
                </div>
              ) : isError ? (
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-400 tracking-tight leading-none">
                    --
                  </div>
                  <h3 className={`text-xs sm:text-sm font-bold text-slate-800 mt-1.5 leading-snug line-clamp-1 ${card.accentColor} transition-colors`}>
                    {card.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
                    Tap to retry view
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none">
                    {card.displayValue}
                  </div>
                  <h3 className={`text-xs sm:text-sm font-bold text-slate-800 mt-1.5 leading-snug line-clamp-1 ${card.accentColor} transition-colors`}>
                    {card.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {card.sublabel}
                  </p>
                </div>
              )}
            </div>

            {/* Subtle bottom border accent on hover */}
            <div className="absolute inset-x-4 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/40 rounded-full transition-all duration-300" />
          </div>
        ))}
      </div>
    </section>
  );
};
