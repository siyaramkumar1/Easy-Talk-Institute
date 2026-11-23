import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, ArrowRight, CheckCircle, BookOpen, Globe, Award, Sparkles, ChevronLeft, ChevronRight, Home 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { readingService, Story, StoryNavigation } from '../services/readingService';
import { useAuthStore } from '../store/useAuthStore';

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Elementary: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Easy: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Intermediate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Advanced: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Hard: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

export default function StoryReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [currentPage, setCurrentPage] = useState<'english' | 'hindi'>('english');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [showFinishedCelebration, setShowFinishedCelebration] = useState(false);

  // Fetch story and navigation
  const { data, isLoading, error } = useQuery({
    queryKey: ['readingStory', id],
    queryFn: () => readingService.getStoryById(id || ''),
    enabled: Boolean(id)
  });

  const story = data?.story;
  const navigation = data?.navigation;

  // Fetch student progress for resume
  const { data: progressData } = useQuery({
    queryKey: ['storyProgress', id],
    queryFn: () => readingService.getStoryProgress(id || ''),
    enabled: Boolean(id && isAuthenticated)
  });

  // Handle URL page param or resume state
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam === 'hindi' || pageParam === 'english') {
      setCurrentPage(pageParam);
    } else if (progressData?.currentPage) {
      setCurrentPage(progressData.currentPage);
      setSearchParams({ page: progressData.currentPage }, { replace: true });
    }
  }, [id, progressData, searchParams]);

  // Save student progress when switching pages
  useEffect(() => {
    if (id && isAuthenticated) {
      readingService.saveStoryProgress(id, {
        currentPage,
        pageCompleted: currentPage === 'hindi'
      }).catch(err => console.error('Error auto-saving progress:', err));
    }
  }, [id, currentPage, isAuthenticated]);

  const changePage = (page: 'english' | 'hindi') => {
    setCurrentPage(page);
    setSearchParams({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Complete Story mutation
  const completeMutation = useMutation({
    mutationFn: () => readingService.completeStory(id || ''),
    onSuccess: (res) => {
      toast.success(res.message || '✓ Story Completed Successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['readingProgressSummary'] });
      queryClient.invalidateQueries({ queryKey: ['storyProgress', id] });
      queryClient.invalidateQueries({ queryKey: ['readingStories'] });

      // If this is the last story across all levels up to Hard, trigger the celebration
      if (navigation?.isLast) {
        setShowFinishedCelebration(true);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record completion');
    }
  });

  const handleCompleteStory = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to record your learning progress');
      return;
    }
    completeMutation.mutate();
  };

  const handleNextStory = () => {
    if (navigation?.nextStory) {
      navigate(`/reading/story/${navigation.nextStory._id}?page=english`);
    } else {
      setShowFinishedCelebration(true);
    }
  };

  const handlePreviousStory = () => {
    if (navigation?.previousStory) {
      navigate(`/reading/story/${navigation.previousStory._id}?page=english`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-900 border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Story Not Found</h2>
          <p className="text-slate-600 text-sm mb-6">
            The story you requested is unavailable or has not been published yet.
          </p>
          <Link
            to="/reading"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Reading
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = Boolean(progressData?.storyCompleted);
  const color = LEVEL_COLORS[story.difficultyLevel] || LEVEL_COLORS.Beginner;

  const fontClass = 
    fontSize === 'large' ? 'text-lg sm:text-xl' :
    fontSize === 'xlarge' ? 'text-xl sm:text-2xl' :
    'text-base sm:text-lg';

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar with Navigation & Font Sizing */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <Link
            to="/reading"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back To Stories
          </Link>

          <div className="flex items-center gap-3">
            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs font-bold text-slate-600">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded-lg transition-colors ${fontSize === 'normal' ? 'bg-blue-900 text-white' : 'hover:bg-slate-100'}`}
                title="Normal text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded-lg text-sm transition-colors ${fontSize === 'large' ? 'bg-blue-900 text-white' : 'hover:bg-slate-100'}`}
                title="Large text"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 rounded-lg text-base transition-colors ${fontSize === 'xlarge' ? 'bg-blue-900 text-white' : 'hover:bg-slate-100'}`}
                title="Extra large text"
              >
                A++
              </button>
            </div>

            {/* Page Mode Tabs: Page 1 English / Page 2 Hindi */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => changePage('english')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  currentPage === 'english'
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Page 1: English
              </button>
              <button
                onClick={() => changePage('hindi')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  currentPage === 'hindi'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Page 2: हिन्दी
              </button>
            </div>
          </div>
        </div>

        {/* Story Reading Container Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className="p-4 sm:p-8 bg-slate-50/70 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${color.bg} ${color.text} ${color.border}`}>
                  {story.difficultyLevel} Level
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Story #{story.displayOrder}
                </span>
              </div>

              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Completed
                </span>
              )}
            </div>

            {currentPage === 'english' ? (
              <div className="space-y-1.5 sm:space-y-2 mt-2">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {story.titleEnglish}
                </h1>
                <p className="text-sm sm:text-base font-medium text-slate-500 leading-normal">
                  {story.titleHindi}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2 mt-2">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {story.titleHindi}
                </h1>
                <p className="text-sm sm:text-base font-medium text-slate-500 leading-normal">
                  {story.titleEnglish} (हिन्दी अनुवाद)
                </p>
              </div>
            )}
          </div>

          {/* Story Content Body (Full content, never truncated, mobile 16px padding) */}
          <div className="px-4 py-6 sm:px-10 sm:py-10 md:px-12 md:py-12 text-slate-800 break-words">
            {currentPage === 'english' ? (
              <div 
                className={`space-y-5 sm:space-y-6 ${fontClass} font-normal tracking-wide text-slate-800 leading-[1.85] break-words`}
                style={{ lineHeight: 1.85 }}
              >
                {story.englishContent.split('\n\n').map((paragraph, index) => {
                  const isMoral = paragraph.trim().toLowerCase().startsWith('moral:') || paragraph.trim().toLowerCase().startsWith('moral :');
                  return (
                    <p 
                      key={index} 
                      className={`text-slate-800 whitespace-pre-line leading-[1.85] break-words ${isMoral ? 'pt-2 sm:pt-3 font-medium text-slate-900' : ''}`}
                      style={{ lineHeight: 1.85 }}
                    >
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div 
                className={`space-y-5 sm:space-y-6 ${fontClass} font-normal tracking-wide text-slate-800 leading-[1.95] break-words`}
                style={{ lineHeight: 1.95 }}
              >
                {story.hindiContent.split('\n\n').map((paragraph, index) => {
                  const isMoral = paragraph.trim().startsWith('सीख:') || paragraph.trim().startsWith('सीख :') || paragraph.trim().startsWith('शिक्षा:');
                  return (
                    <p 
                      key={index} 
                      className={`text-slate-800 whitespace-pre-line leading-[1.95] break-words ${isMoral ? 'pt-2 sm:pt-3 font-medium text-slate-900' : ''}`}
                      style={{ lineHeight: 1.95 }}
                    >
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200">
            {currentPage === 'english' ? (
              /* PAGE 1 (English) Navigation */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-4">
                <div className="w-full sm:w-auto">
                  {navigation?.previousStory ? (
                    <button
                      onClick={handlePreviousStory}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous Story ({navigation.previousStory.difficultyLevel})
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic block text-center sm:text-left py-1">
                      First story in reading practice
                    </span>
                  )}
                </div>

                <button
                  onClick={() => changePage('hindi')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm sm:text-base shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Next: Read Hindi Translation <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* PAGE 2 (Hindi) Navigation */
              <div className="flex flex-col gap-3.5 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-2.5">
                    <button
                      onClick={() => changePage('english')}
                      className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-colors flex-1 sm:flex-none"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous (English)
                    </button>

                    <Link
                      to="/reading"
                      className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs sm:text-sm transition-colors flex-1 sm:flex-none text-center"
                    >
                      <Home className="w-4 h-4" /> Back To Stories
                    </Link>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={handleCompleteStory}
                      disabled={completeMutation.isPending || isCompleted}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isCompleted ? 'Completed' : 'Complete Story'}
                    </button>

                    <button
                      onClick={handleNextStory}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-900/20 transition-all active:scale-95"
                    >
                      {navigation?.nextStory ? (
                        <>
                          Next ({navigation.nextStory.difficultyLevel}) <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Finish <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal when student finishes all available stories up to Hard */}
      {showFinishedCelebration && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Award className="w-10 h-10" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Mastery Achieved
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-3 mb-2">
              Congratulations!
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6">
              You have completed all available Reading Practice stories from Beginner to Hard level. Keep practicing daily to maintain fluency!
            </p>
            <button
              onClick={() => {
                setShowFinishedCelebration(false);
                navigate('/reading');
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-base shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
            >
              Back To Reading
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
