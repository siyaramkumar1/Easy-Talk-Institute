import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Search, BookOpen, AlertCircle, 
  CheckCircle2, XCircle, ArrowUpDown, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { readingService, Story } from '../../services/readingService';

const DIFFICULTY_LEVELS = [
  'Beginner',
  'Elementary',
  'Easy',
  'Intermediate',
  'Advanced',
  'Hard'
] as const;

const LEVEL_BADGES: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  Elementary: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Easy: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  Intermediate: { bg: 'bg-amber-100', text: 'text-amber-800' },
  Advanced: { bg: 'bg-purple-100', text: 'text-purple-800' },
  Hard: { bg: 'bg-rose-100', text: 'text-rose-800' }
};

export default function AdminReadingStories() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    titleEnglish: '',
    titleHindi: '',
    englishContent: '',
    hindiContent: '',
    shortDescription: '',
    difficultyLevel: 'Beginner' as Story['difficultyLevel'],
    displayOrder: 1,
    status: 'Draft' as Story['status']
  });

  // Query stories
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['adminReadingStories', { statusFilter, levelFilter, search }],
    queryFn: () => readingService.getAdminStories({
      status: statusFilter,
      difficultyLevel: levelFilter,
      search
    })
  });

  const resetForm = () => {
    setFormData({
      titleEnglish: '',
      titleHindi: '',
      englishContent: '',
      hindiContent: '',
      shortDescription: '',
      difficultyLevel: 'Beginner',
      displayOrder: 1,
      status: 'Draft'
    });
    setEditingStory(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (story: Story) => {
    setEditingStory(story);
    setFormData({
      titleEnglish: story.titleEnglish,
      titleHindi: story.titleHindi,
      englishContent: story.englishContent || '',
      hindiContent: story.hindiContent || '',
      shortDescription: story.shortDescription || '',
      difficultyLevel: story.difficultyLevel,
      displayOrder: story.displayOrder,
      status: story.status
    });
    setShowModal(true);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Story>) => readingService.createStory(data),
    onSuccess: (res) => {
      toast.success(res.message || '✓ Story Created Successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['adminReadingStories'] });
      queryClient.invalidateQueries({ queryKey: ['readingStories'] });
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create story');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Story> }) => 
      readingService.updateStory(id, data),
    onSuccess: (res) => {
      toast.success(res.message || '✓ Story Updated Successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['adminReadingStories'] });
      queryClient.invalidateQueries({ queryKey: ['readingStories'] });
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update story');
    }
  });

  // Status toggle mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Story['status'] }) =>
      readingService.updateStoryStatus(id, status),
    onSuccess: (res) => {
      toast.success(res.message || '✓ Changes Saved Successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['adminReadingStories'] });
      queryClient.invalidateQueries({ queryKey: ['readingStories'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to change status');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => readingService.deleteStory(id),
    onSuccess: (res) => {
      toast.success(res.message || '✓ Story Deleted Successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['adminReadingStories'] });
      queryClient.invalidateQueries({ queryKey: ['readingStories'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete story');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleEnglish.trim() || !formData.titleHindi.trim()) {
      toast.error('Both English and Hindi titles are required');
      return;
    }
    if (!formData.englishContent.trim() || !formData.hindiContent.trim()) {
      toast.error('Both English content and Hindi translation are required');
      return;
    }

    if (editingStory) {
      updateMutation.mutate({ id: editingStory._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (story: Story) => {
    const nextStatus: Story['status'] = story.status === 'Published' ? 'Draft' : 'Published';
    statusMutation.mutate({ id: story._id, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-900" /> Reading Stories Management
          </h2>
          <p className="text-slate-600 text-sm">
            Manage bilingual reading practice stories from Beginner to Hard difficulty levels.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add New Story
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stories by English or Hindi title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Difficulty Levels</option>
            {DIFFICULTY_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent mb-2"></div>
            <p className="text-slate-500 text-sm">Loading stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Stories Found</h3>
            <p className="text-slate-500 text-sm">Add your first reading practice story or adjust filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4 w-16">Order</th>
                  <th className="p-4">Titles (English / Hindi)</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stories.map((story: Story) => {
                  const badge = LEVEL_BADGES[story.difficultyLevel] || LEVEL_BADGES.Beginner;
                  return (
                    <tr key={story._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-500">
                        #{story.displayOrder}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{story.titleEnglish}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{story.titleHindi}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${badge.bg} ${badge.text}`}>
                          {story.difficultyLevel}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePublish(story)}
                          title={story.status === 'Published' ? 'Click to unpublish' : 'Click to publish'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                            story.status === 'Published'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : story.status === 'Draft'
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {story.status === 'Published' ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          {story.status}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(story)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Story"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(story._id, story.titleEnglish)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Story"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Story Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">
                {editingStory ? 'Edit Reading Story' : 'Create Reading Story'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    English Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleEnglish}
                    onChange={(e) => setFormData({ ...formData, titleEnglish: e.target.value })}
                    placeholder="e.g. The Honest Woodcutter"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hindi Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleHindi}
                    onChange={(e) => setFormData({ ...formData, titleHindi: e.target.value })}
                    placeholder="e.g. ईमानदार लकड़हारा"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Difficulty Level *
                  </label>
                  <select
                    value={formData.difficultyLevel}
                    onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {DIFFICULTY_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Display Order *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Brief synopsis shown on story cards"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  English Story Content * (Full text, paragraphs separated by blank lines)
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.englishContent}
                  onChange={(e) => setFormData({ ...formData, englishContent: e.target.value })}
                  placeholder="Type or paste the complete English story here..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hindi Translation * (Full Hindi translation)
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.hindiContent}
                  onChange={(e) => setFormData({ ...formData, hindiContent: e.target.value })}
                  placeholder="यहाँ पूरी हिन्दी कहानी या अनुवाद लिखें..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  {editingStory ? 'Update Story' : 'Create Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
