import React from 'react';
import { Star, ArrowRight, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { testimonialService } from '../../services/testimonialService';

// Helper to compute initials like "SK", "AK", "PK"
const getInitials = (name: string): string => {
  if (!name) return 'ET';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const TestimonialCarousel = () => {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials', 'active'],
    queryFn: () => testimonialService.getTestimonials({ status: 'Active', featured: true })
  });

  // Filter out any spam/test entries and deduplicate by student name
  const validTestimonials = (Array.isArray(testimonials) ? testimonials : []).filter(t => 
    t && t.studentName && t.reviewMessage && 
    t.studentName.trim().length >= 3 && 
    t.reviewMessage.trim().length >= 10 &&
    !/^[a-z]{4,}$/i.test(t.studentName.trim())
  );

  const uniqueTestimonials = validTestimonials.filter((t, index, self) =>
    index === self.findIndex((inner) => inner.studentName.trim().toLowerCase() === t.studentName.trim().toLowerCase())
  );

  if (uniqueTestimonials.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
            <span role="img" aria-label="star" className="text-sm">⭐</span>
            <span>Verified Student Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Success Stories
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-1 max-w-xl">
            Hear from students in Jehanabad and across Bihar who transformed their careers and fluency at Easy Talk Institute.
          </p>
        </div>

        <Link
          to="/testimonials"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/80 px-4 py-2.5 rounded-xl border border-blue-200/60 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>Read All Reviews</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Premium Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueTestimonials.slice(0, 3).map((t, idx) => {
          const photoUrl = t.studentPhoto?.imageUrl || t.studentPhoto?.url || t.imageUrl || (typeof t.studentPhoto === 'string' ? t.studentPhoto : '');
          const ratingValue = Number(t.rating) || 5;
          const achievementText = t.achievement || '🏆 Improved English Communication Skills';

          return (
            <div
              key={t._id || idx}
              className="bg-white rounded-[20px] border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between group hover:border-amber-200 relative"
            >
              <div>
                {/* Header: Rating Stars & Subtle Quote */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < ratingValue
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1">
                      {ratingValue}.0
                    </span>
                  </div>

                  <Quote className="w-6 h-6 text-blue-100 group-hover:text-blue-200 transition-colors" />
                </div>

                {/* Review Message */}
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-4 italic">
                  "{t.reviewMessage}"
                </p>
              </div>

              <div>
                {/* Achievement Badge */}
                <div className="mb-4 bg-emerald-50/80 border border-emerald-100/80 px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <span className="select-none">🏆</span>
                  <span className="truncate">{achievementText}</span>
                </div>

                {/* Student Info: Photo Placeholder + Name + Course */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={t.studentName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-blue-100 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-sm ${
                      photoUrl ? 'hidden' : 'flex'
                    } items-center justify-center shrink-0 shadow-2xs border border-white`}
                  >
                    {getInitials(t.studentName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {t.studentName}
                    </h4>
                    <p className="text-[11px] font-medium text-blue-600 truncate">
                      {t.courseName || 'Spoken English & Personality Development'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
