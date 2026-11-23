import React from 'react';
import { useState, useEffect } from 'react';
import { Filter, Users, Award, BookOpen, Camera, Mic, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { galleryService, GalleryItem, GalleryCategory } from '../services/galleryService';
import { statisticService } from '../services/statisticService';
import { 
  getProfessionalGalleryContent, 
  formatCategoryLabel, 
  formatGalleryDate 
} from '../utils/galleryContent';
import { optimizeImageUrl } from '../utils/imageOptimizer';

export default function Gallery() {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const { data: stats = [] } = useQuery({ queryKey: ['statistics', 'gallery'], queryFn: () => statisticService.getStatistics({ section: 'gallery', status: 'Active' }) });
  const { data: photos = [], isLoading: loadingPhotos, isError: isErrorPhotos, refetch: refetchPhotos } = useQuery({
    queryKey: ['gallery', 'items'],
    queryFn: () => galleryService.getGallery({ status: 'Published' })
  });
  
  const { data: categories = [], isLoading: loadingCategories, isError: isErrorCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['gallery', 'categories'],
    queryFn: () => galleryService.getCategories()
  });
  
  const isError = isErrorCategories || isErrorPhotos;

  const safeStats = Array.isArray(stats) ? stats : [];
  // Ensure only Published/Active photos are shown, never Draft or Inactive
  const safePhotos = (Array.isArray(photos) ? photos : []).filter(
    p => (p.status as string) !== 'Draft' && (p.status as string) !== 'Inactive'
  );
  const safeCategories = Array.isArray(categories) ? categories : [];

  const loading = loadingPhotos || loadingCategories;

  const filteredPhotos = activeTab === 'All' 
    ? safePhotos 
    : safePhotos.filter(p => p.category === activeTab || formatCategoryLabel(p.category) === formatCategoryLabel(activeTab));
  
  const allCategories = ['All', ...safeCategories.map(c => c.name)];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex < filteredPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleClose = () => {
    setSelectedPhotoIndex(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 max-w-4xl mx-auto space-y-2.5 sm:space-y-4">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight">
            Institute Gallery
          </h1>
          <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl sm:max-w-3xl mx-auto px-2 sm:px-0 font-normal">
            Explore the learning environment, student achievements, academic activities, classroom interactions, and special events that make Easy Talk Institute a trusted destination for Spoken English and Personality Development.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          { (Array.isArray(safeStats) ? safeStats : []).map((stat: any) => {
            const IconComp = stat.icon === 'Users' ? Users : stat.icon === 'Award' ? Award : stat.icon === 'Mic' ? Mic : BookOpen;
            return (
            <div key={stat._id} className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mb-2.5 sm:mb-4">
                <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">{stat.value}</p>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
          )})}
        </div>

        {isError ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-red-600 mb-2">Unable to load gallery</h3>
            <button onClick={() => { refetchCategories(); refetchPhotos(); }} className="px-6 py-2 bg-blue-900 text-white rounded-lg mt-4 cursor-pointer hover:bg-blue-800 transition-colors">Retry</button>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-slate-500">Loading gallery...</div>
        ) : safePhotos.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Camera className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-700">No gallery images available</h3>
            <p className="text-xs text-slate-400 mt-1">Please check back soon for updates.</p>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            {safeCategories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-1">
                {allCategories.map(category => {
                  const label = formatCategoryLabel(category);
                  const isSelected = activeTab === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setActiveTab(category)}
                      className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                        isSelected 
                        ? 'bg-blue-900 text-white shadow-md shadow-blue-950/15 scale-[1.02]' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Photo Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              { (Array.isArray(filteredPhotos) ? filteredPhotos : []).map((photo, index) => {
                const { title, description } = getProfessionalGalleryContent(photo);
                const categoryLabel = formatCategoryLabel(photo.category);
                const uploadDate = formatGalleryDate(photo.createdAt);

                return (
                  <div 
                    key={photo._id} 
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                    onClick={() => setSelectedPhotoIndex(index)}
                  >
                    {/* Image Container */}
                    <div>
                      <div className="h-52 sm:h-64 overflow-hidden relative bg-slate-100">
                        <div className="absolute inset-0 bg-blue-950/30 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center backdrop-blur-xs">
                          <div className="bg-white/90 text-blue-950 px-3.5 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-lg">
                            <Camera className="w-4 h-4" />
                            <span>View Photo</span>
                          </div>
                        </div>
                        <img 
                          src={optimizeImageUrl(photo.imageUrl, 600)} 
                          alt={title} 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Card Content Presentation */}
                      <div className="p-4 sm:p-6">
                        {/* Category & Date Bar */}
                        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                          <span className="text-[11px] sm:text-xs font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 tracking-wide uppercase">
                            {categoryLabel}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{uploadDate}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-blue-900 transition-colors">
                          {title}
                        </h3>

                        {/* Professional Description with Fallback */}
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 sm:mt-2.5 leading-relaxed line-clamp-3">
                          {description}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Accent */}
                    <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-t border-slate-100 text-xs text-blue-900 font-semibold group-hover:text-blue-700">
                      <span>Explore Moments</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredPhotos.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto p-8">
                <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">No photos found in this category</h3>
                <p className="text-slate-500 text-sm">Check back soon for new additions to this activity showcase.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full Screen Image Viewer */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && filteredPhotos[selectedPhotoIndex] && (() => {
          const currentPhoto = filteredPhotos[selectedPhotoIndex];
          const { title, description } = getProfessionalGalleryContent(currentPhoto);
          const categoryLabel = formatCategoryLabel(currentPhoto.category);
          const uploadDate = formatGalleryDate(currentPhoto.createdAt);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm touch-none"
              onClick={handleClose}
            >
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-start bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20">
                <div className="text-white max-w-[80vw]">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                      {categoryLabel}
                    </span>
                    <span className="text-xs text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {uploadDate}
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-xl text-white drop-shadow-sm">
                    {title}
                  </h3>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleClose(); }}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors cursor-pointer"
                  title="Close viewer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Main Image */}
              <motion.img
                key={currentPhoto._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={optimizeImageUrl(currentPhoto.imageUrl, 1600)}
                alt={title}
                className="max-w-full max-h-[85vh] object-contain select-none px-4"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset }) => {
                  const swipe = offset.x;
                  if (swipe < -50) handleNext(e as any);
                  else if (swipe > 50) handlePrev(e as any);
                }}
              />

              {/* Navigation Arrows (Desktop) */}
              {selectedPhotoIndex > 0 && (
                <button 
                  onClick={handlePrev}
                  className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors hidden md:block z-20 cursor-pointer"
                  title="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              
              {selectedPhotoIndex < filteredPhotos.length - 1 && (
                <button 
                  onClick={handleNext}
                  className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors hidden md:block z-20 cursor-pointer"
                  title="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
              
              {/* Professional Description Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20">
                <p className="text-white/95 text-xs sm:text-sm md:text-base max-w-3xl mx-auto text-center font-normal leading-relaxed">
                  {description}
                </p>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
