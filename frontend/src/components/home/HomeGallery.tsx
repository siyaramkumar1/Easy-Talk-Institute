import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, Calendar, Sparkles } from 'lucide-react';
import { 
  getProfessionalGalleryContent, 
  formatCategoryLabel, 
  formatGalleryDate 
} from '../../utils/galleryContent';
import { optimizeImageUrl } from '../../utils/imageOptimizer';

export const HomeGallery = () => {
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['publicGallery'],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/gallery/public');
        const data = res.data?.success ? res.data.data : res.data;
        return Array.isArray(data) ? data.slice(0, 4) : [];
      } catch (err) {
        return [];
      }
    }
  });

  const safePhotos = (Array.isArray(photos) ? photos : []).filter(
    (p: any) => p.status !== 'Draft' && p.status !== 'Inactive'
  );

  if (isLoading || safePhotos.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-100">
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Campus Moments & Events</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institute Life & Showcase
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-1 max-w-xl">
            A glimpse into classroom interactions, speaking debates, felicitation days, and student milestones at Easy Talk.
          </p>
        </div>

        <Link
          to="/gallery"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/80 px-4 py-2.5 rounded-xl border border-blue-200/60 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>View Full Gallery</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Modern Showcase Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {safePhotos.map((photo: any) => {
          const { title, description } = getProfessionalGalleryContent(photo);
          const categoryLabel = formatCategoryLabel(photo.category);
          const uploadDate = formatGalleryDate(photo.createdAt);

          return (
            <Link
              to="/gallery"
              key={photo._id}
              className="bg-white rounded-[20px] overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between hover:border-blue-300 cursor-pointer"
            >
              <div>
                {/* Image Container */}
                <div className="h-44 sm:h-48 overflow-hidden relative bg-slate-100">
                  <img
                    src={optimizeImageUrl(photo.imageUrl, 500)}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[11px] font-bold text-blue-900 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-white shadow-xs">
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Date Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="text-[11px] font-semibold text-slate-700 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {uploadDate}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {description}
                  </p>
                </div>
              </div>

              {/* Action Button: Explore Showcase */}
              <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-100">
                <span className="w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-between transition-colors">
                  <span>Explore Showcase</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
