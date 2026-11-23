import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, CheckCircle, ArrowRight, BookMarked, Award, 
  Filter, RefreshCw, Sparkles, Compass, Languages, ChevronRight 
} from 'lucide-react';
import { readingService, Story } from '../services/readingService';
import { useAuthStore } from '../store/useAuthStore';

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Elementary: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Easy: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Intermediate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Advanced: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Hard: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

const LEVELS = ['All', 'Beginner', 'Elementary', 'Easy', 'Intermediate', 'Advanced', 'Hard'] as const;

export default function Reading() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  // Fetch published stories
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['readingStories', 'public'],
    queryFn: readingService.getPublicStories
  });

  // Fetch student progress if authenticated
  const { data: progressSummary } = useQuery({
    queryKey: ['readingProgressSummary'],
    queryFn: readingService.getProgressSummary,
    enabled: isAuthenticated
  });

  const completedIds = new Set(progressSummary?.completedStoryIds || []);
  const progressMap = progressSummary?.progressByStoryId || {};

  const filteredStories = stories.filter((story: Story) => {
    if (story.status !== 'Published') return false;
    if (selectedLevel === 'All') return true;
    return story.difficultyLevel === selectedLevel;
  });

  const continueStory = progressSummary?.continueReading?.story;
  const continueProgress = progressSummary?.continueReading?.progress;
  const hasStarted = Boolean(progressSummary?.hasStarted || (progressSummary?.totalCompleted ?? 0) > 0);

  // First published story (for zero progress state)
  const firstBeginnerStory = stories.find(s => s.difficultyLevel === 'Beginner') || stories[0];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - Phase 2 */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs sm:text-sm mb-3 shadow-sm">
            <Languages className="w-4 h-4 text-blue-700" />
            <span>Bilingual Reading • English + हिन्दी</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
            Reading Practice
          </h1>
          <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-3">
            English Reading Practice
          </h2>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Improve your English reading skills through simple stories and gradually move from Beginner to Hard level with bilingual support.
          </p>
        </div>

        {/* Reading Progress Area - Phase 4, 8 & 16 */}
        {isAuthenticated ? (
          hasStarted && continueStory ? (
            /* Student has existing progress - Continue Reading Card */
            <div className="mb-10 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                      Continue Reading
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold">
                      Resume From: <strong className="text-white">{continueProgress?.currentPage === 'hindi' ? 'Hindi' : 'English'}</strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">
                      CURRENT LEVEL: {continueStory.difficultyLevel}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {continueStory.titleEnglish}
                    </h3>
                    <p className="text-blue-200 font-medium text-sm sm:text-base mt-0.5">
                      {continueStory.titleHindi}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {progressSummary && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-200 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-400" /> Reading Progress
                        </span>
                        <span>
                          {progressSummary.totalCompleted} / {progressSummary.totalStories} Stories Completed
                        </span>
                      </div>
                      <div className="w-full bg-blue-950/80 rounded-full h-2.5 overflow-hidden border border-blue-800/40">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressSummary.totalStories > 0 ? (progressSummary.totalCompleted / progressSummary.totalStories) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex sm:items-center">
                  <button
                    onClick={() => navigate(`/reading/story/${continueStory._id}?page=${continueProgress?.currentPage || 'english'}`)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" /> Continue Reading <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Student has NO progress yet - First-Reading State */
            <div className="mb-10 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-bold uppercase tracking-wider inline-block mb-3">
                    Start Your Reading Journey
                  </span>
                  <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                    CURRENT LEVEL: Beginner
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {firstBeginnerStory?.titleEnglish || 'Start with your first short story'}
                  </h3>
                  <p className="text-blue-200 text-sm">
                    {firstBeginnerStory?.titleHindi || 'पहनी कहानी से शुरुआत करें'} • Build vocabulary with bilingual guidance.
                  </p>
                </div>

                <div className="shrink-0">
                  {firstBeginnerStory && (
                    <button
                      onClick={() => navigate(`/reading/story/${firstBeginnerStory._id}?page=english`)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" /> Start Reading <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          /* Public Unauthenticated Info Banner */
          <div className="mb-10 bg-blue-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h4 className="text-base font-bold">Track Your Reading Mastery</h4>
                <p className="text-xs sm:text-sm text-blue-200">
                  Sign in to save your current page, resume where you left off, and track completed stories.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-white text-blue-950 font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
            >
              Sign In To Track Progress
            </Link>
          </div>
        )}

        {/* Level Filters - Phase 3 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2 shrink-0 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Levels:
          </div>
          {LEVELS.map(level => {
            const isActive = selectedLevel === level;
            const count = level === 'All' 
              ? stories.filter(s => s.status === 'Published').length
              : stories.filter(s => s.status === 'Published' && s.difficultyLevel === level).length;

            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{level}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stories Grid - Phases 5, 6 & 7 */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-900 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading reading stories...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookMarked className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Stories in this Level</h3>
            <p className="text-slate-600 text-sm mb-6">
              Check back soon or select another difficulty level to start practicing your English reading.
            </p>
            <button
              onClick={() => setSelectedLevel('All')}
              className="px-6 py-2.5 bg-blue-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              Show All Stories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story: Story) => {
              const isCompleted = completedIds.has(story._id);
              const p = progressMap[story._id];
              const inProgress = p && !p.storyCompleted && (p.pageCompleted || p.currentPage === 'hindi');
              const color = LEVEL_COLORS[story.difficultyLevel] || LEVEL_COLORS.Beginner;

              return (
                <div
                  key={story._id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Top: Difficulty Badge + Completion / Progress Status */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${color.bg} ${color.text} ${color.border}`}>
                        {story.difficultyLevel}
                      </span>
                      
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Completed
                        </span>
                      ) : inProgress ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600" /> In Progress
                        </span>
                      ) : null}
                    </div>

                    {/* Titles */}
                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-900 transition-colors">
                      {story.titleEnglish}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mb-3">
                      {story.titleHindi}
                    </p>

                    {/* Description */}
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                      {story.shortDescription || 'Improve your vocabulary, grammar, and fluency with this engaging bilingual story.'}
                    </p>
                  </div>

                  {/* Card Footer: Order + Action Button - Phase 7 */}
                  <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      Story {String(story.displayOrder).padStart(2, '0')}
                    </span>
                    
                    {isCompleted ? (
                      <Link
                        to={`/reading/story/${story._id}?page=english`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                      >
                        Read Again <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : inProgress ? (
                      <Link
                        to={`/reading/story/${story._id}?page=${p?.currentPage || 'english'}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/10 transition-all"
                      >
                        Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <Link
                        to={`/reading/story/${story._id}?page=english`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-md shadow-blue-900/10 transition-all"
                      >
                        Read Story <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
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
