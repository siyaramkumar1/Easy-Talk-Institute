import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, PlayCircle, BookOpen, Clock, Activity, CheckCircle, BarChart2, FileText, FileUp } from 'lucide-react';
import axios from 'axios';

export interface AdminAssessmentTestsProps {
  onManageQuestions?: (testSlug: string) => void;
  onImportPdf?: (testSlug: string) => void;
}

export const AdminAssessmentTests: React.FC<AdminAssessmentTestsProps> = ({ 
  onManageQuestions, 
  onImportPdf 
}) => {
  const [tests, setTests] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', category: 'General', difficulty: 'Medium',
    duration: 30, totalQuestions: 30, passingMarks: 12, status: 'Draft', displayOrder: 0
  });

  const fetchTests = async () => {
    try {
      const res = await axios.get('/api/admin-tests');
      setTests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleEdit = (test: any) => {
    setEditingTest(test);
    setFormData({
      title: test.title || '',
      slug: test.slug || '',
      description: test.description || '',
      category: test.category || 'General',
      difficulty: test.difficulty || 'Medium',
      duration: test.duration || 30,
      totalQuestions: test.totalQuestions || 30,
      passingMarks: test.passingMarks || 12,
      status: test.status || 'Draft',
      displayOrder: test.displayOrder || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await axios.delete(`/api/admin-tests/${id}`);
        fetchTests();
      } catch (err) {
        console.error("Failed to delete test", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await axios.put(`/api/admin-tests/${editingTest._id}`, formData);
      } else {
        await axios.post('/api/admin-tests', formData);
      }
      setShowModal(false);
      setEditingTest(null);
      setFormData({ title: '', slug: '', description: '', category: 'General', difficulty: 'Medium', duration: 30, totalQuestions: 30, passingMarks: 12, status: 'Draft', displayOrder: 0 });
      fetchTests();
    } catch (err) {
      console.error("Failed to save test", err);
    }
  };

  const filteredTests = tests.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: prev.slug || generateSlug(newTitle)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Assessment Tests</h2>
          <p className="text-slate-500 mt-1">Manage and organize English proficiency tests.</p>
        </div>
        <button onClick={() => { setEditingTest(null); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Add New Test
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Tests</p>
            <p className="text-2xl font-bold text-slate-800">{tests.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Published</p>
            <p className="text-2xl font-bold text-slate-800">{tests.filter(t => t.status === 'Published').length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Drafts</p>
            <p className="text-2xl font-bold text-slate-800">{tests.filter(t => t.status === 'Draft').length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Questions</p>
            <p className="text-2xl font-bold text-slate-800">
              {tests.reduce((acc, curr) => acc + (curr.totalQuestions || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tests by title or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-slate-400 shrink-0" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-5">Test Details</th>
                <th className="p-5">Level & Category</th>
                <th className="p-5">Duration & Qs</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((test) => (
                <tr key={test._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5 shrink-0">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-base">{test.title}</p>
                        <p className="text-slate-500 text-sm mt-0.5 max-w-xs truncate">{test.description || 'No description'}</p>
                        <p className="text-slate-400 text-xs mt-1 font-mono">{test.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-700">{test.category}</span>
                      <span className="text-sm text-slate-500">{test.difficulty}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {test.duration} mins
                      </span>
                      <span className="text-sm text-slate-500">
                        {test.totalQuestions} Questions (Pass: {test.passingMarks})
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      test.status === 'Published' ? 'bg-green-50 text-green-700 border-green-200' : 
                      test.status === 'Archived' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-1.5 transition-opacity">
                      {onManageQuestions && (
                        <button 
                          onClick={() => onManageQuestions(test.slug)} 
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Open Question Management"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Questions</span>
                        </button>
                      )}
                      {onImportPdf && (
                        <button 
                          onClick={() => onImportPdf(test.slug)} 
                          className="p-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Import Questions from PDF"
                        >
                          <FileUp className="w-3.5 h-3.5 text-purple-600" />
                          <span className="hidden sm:inline">Import</span>
                        </button>
                      )}
                      <button onClick={() => handleEdit(test)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit Test">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(test._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Test">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-800 mb-1">No tests found</h3>
                      <p className="text-slate-500">We couldn't find any tests matching your criteria.</p>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-600 font-medium hover:underline">
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingTest ? <><Edit className="w-5 h-5 text-blue-600" /> Edit Assessment Test</> : <><Plus className="w-5 h-5 text-blue-600" /> Add New Assessment Test</>}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Test Title</label>
                  <input type="text" value={formData.title} onChange={handleTitleChange} placeholder="e.g., Advanced English Grammar Test" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">URL Slug</label>
                  <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="advanced-grammar" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Category</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g., Grammar, Vocabulary, Speaking" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                </div>
                
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Provide a brief description of what this test assesses..." rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"></textarea>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Difficulty Level</label>
                  <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white" required>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Duration (Minutes)</label>
                  <input type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Total Questions Expected</label>
                  <input type="number" min="1" value={formData.totalQuestions} onChange={e => setFormData({...formData, totalQuestions: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Passing Marks</label>
                  <input type="number" min="1" value={formData.passingMarks} onChange={e => setFormData({...formData, passingMarks: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white" required>
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Published">Published (Public)</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Display Order</label>
                  <input type="number" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                  <p className="text-xs text-slate-500 mt-1">Lower numbers appear first on the assessments page.</p>
                </div>
              </div>

            </form>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200/50 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm">
                {editingTest ? 'Save Changes' : 'Create Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
