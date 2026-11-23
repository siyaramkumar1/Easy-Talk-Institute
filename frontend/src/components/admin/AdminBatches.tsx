import { useAuthStore } from '../../store/useAuthStore';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, Eye, Calendar, Users, Clock, MapPin, Loader2, BookOpen, User, Image } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Batch {
  _id: string;
  name: string;
  course: any;
  description: string;
  trainer: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timing: string;
  capacity: number;
  enrolledStudents: number;
  status: string;
  thumbnail: { url: string, publicId: string };
  thumbnailFile?: File | null;
  useDefaultThumbnail?: boolean;
}

export const AdminBatches = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [highlightSeats, setHighlightSeats] = useState(false);
  const location = useLocation();

  const { data: batches = [], isLoading: loadingBatches } = useQuery({
    queryKey: ['adminBatches'],
    queryFn: async () => {
      const res = await axios.get('/api/batches');
      return res.data;
    }
  });

  // Sync filters & selection with URL query params or /admin/batches/:id
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    const highlightParam = params.get('highlight');
    const pathParts = location.pathname.split('/batches/');
    const pathId = pathParts.length > 1 && pathParts[1] ? pathParts[1].split('/')[0] : null;
    const batchIdParam = params.get('id') || pathId;

    if (statusParam) {
      if (statusParam.toLowerCase() === 'active') setFilterStatus('Active');
      else if (statusParam.toLowerCase() === 'upcoming') setFilterStatus('Upcoming');
      else if (statusParam.toLowerCase() === 'completed') setFilterStatus('Completed');
    }

    if (highlightParam === 'seats') {
      setHighlightSeats(true);
    }

    if (batchIdParam && batches.length > 0) {
      const found = batches.find((b: Batch) => b._id === batchIdParam);
      if (found) {
        setViewingBatch(found);
        setShowViewModal(true);
      }
    }
  }, [location.search, location.pathname, batches]);

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: async () => {
      const res = await axios.get('/api/courses?status=all');
      return res.data;
    }
  });

  const loading = loadingBatches || loadingCourses;

  const [formData, setFormData] = useState({
    name: '',
    course: '',
    description: '',
    trainer: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    capacity: 30,
    status: 'Upcoming',
    thumbnailFile: null as File | null,
    thumbnailPreview: null as string | null,
    useDefaultThumbnail: false
  });



  const handleOpenModal = (batch: Batch | null = null) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({
        name: batch.name || '',
        course: batch.course?._id || '',
        description: batch.description || '',
        trainer: batch.trainer || '',
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
        endDate: batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '',
        startTime: batch.startTime || '',
        endTime: batch.endTime || '',
        capacity: batch.capacity || 30,
        status: batch.status || 'Upcoming',
        thumbnail: null,
        useDefaultThumbnail: false
      });
    } else {
      setEditingBatch(null);
      setFormData({
        name: '',
        course: courses.length > 0 ? courses[0]._id : '',
        description: '',
        trainer: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        capacity: 30,
        status: 'Upcoming',
        thumbnail: null as any,
        useDefaultThumbnail: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBatch(null);
    setFormData(prev => ({...prev, thumbnailPreview: null, thumbnailFile: null}));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'file') {
       const file = (e.target as HTMLInputElement).files?.[0] || null;
       setFormData(prev => ({
         ...prev,
         thumbnailFile: file,
         thumbnailPreview: file ? URL.createObjectURL(file) : null
       }));
    } else {
       setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'thumbnailFile' && formData.thumbnailFile) {
        data.append('thumbnail', formData.thumbnailFile);
      } else if (key === 'useDefaultThumbnail' && formData.useDefaultThumbnail) {
        data.append('defaultThumbnail', 'true');
      } else if (key !== 'thumbnailFile' && key !== 'thumbnail' && key !== 'useDefaultThumbnail') {
        data.append(key, (formData as any)[key]);
      }
    });
    
    if (!formData.thumbnailFile && !formData.useDefaultThumbnail && !editingBatch) {
      toast.error('Batch thumbnail is required');
      return;
    }
    

    try {
      setIsSubmitting(true);
      if (editingBatch) {
        await axios.put(`/api/batches/${editingBatch._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Batch updated successfully', { duration: 3000 });
      } else {
        await axios.post('/api/batches', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Batch created successfully', { duration: 3000 });
      }
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['adminBatches'] });
      queryClient.invalidateQueries({ queryKey: ['publicBatches'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['homeBatchStats'] });
      queryClient.invalidateQueries({ queryKey: ['homeLiveStats'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    } catch (err: any) {
      toast.error("Error saving batch: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.put(`/api/batches/${id}`, { status: newStatus });
      toast.success('Batch status updated successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['adminBatches'] });
      queryClient.invalidateQueries({ queryKey: ['publicBatches'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['homeBatchStats'] });
      queryClient.invalidateQueries({ queryKey: ['homeLiveStats'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update batch status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await axios.delete(`/api/batches/${deleteTarget._id}`);
      toast.success('Batch deleted successfully', { duration: 3000 });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminBatches'] });
      queryClient.invalidateQueries({ queryKey: ['publicBatches'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['homeBatchStats'] });
      queryClient.invalidateQueries({ queryKey: ['homeLiveStats'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error deleting batch");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBatches = (Array.isArray(batches) ? batches : []).filter(b => {
    const matchesSearch = 
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.trainer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeBatches = batches.filter(b => b.status === 'Active').length;
  const upcomingBatches = batches.filter(b => b.status === 'Upcoming').length;
  const completedBatches = batches.filter(b => b.status === 'Completed').length;
  const totalStudents = batches.reduce((acc, curr) => acc + (curr.enrolledStudents || 0), 0);
  const availableSeats = batches.reduce((acc, curr) => acc + Math.max(0, (curr.capacity || 0) - (curr.enrolledStudents || 0)), 0);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Upcoming': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Inactive': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Completed': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Batch Management</h2>
          <p className="text-slate-500 text-sm mt-1">Create and manage all learning batches, schedules, trainers and seats.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium">
          <Plus className="w-5 h-5" /> Create Batch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase mb-1">Total Batches</p>
          <p className="text-2xl font-bold text-slate-800">{batches.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-green-600 font-medium uppercase mb-1">Active</p>
          <p className="text-2xl font-bold text-slate-800">{activeBatches}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-blue-600 font-medium uppercase mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-slate-800">{upcomingBatches}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-purple-600 font-medium uppercase mb-1">Completed</p>
          <p className="text-2xl font-bold text-slate-800">{completedBatches}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase mb-1">Students</p>
          <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-orange-600 font-medium uppercase mb-1">Available Seats</p>
          <p className="text-2xl font-bold text-slate-800">{availableSeats}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search batches by name, course, trainer..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Inactive">Inactive</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(n => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm animate-pulse">
               <div className="w-full h-32 bg-slate-200 rounded-xl mb-4"></div>
               <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
               <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
               <div className="space-y-2 mb-4">
                 <div className="h-4 bg-slate-200 rounded w-full"></div>
                 <div className="h-4 bg-slate-200 rounded w-full"></div>
               </div>
            </div>
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Batches Found</h3>
          <p className="text-slate-500 mb-6">Create your first batch to start managing classes.</p>
          {(searchQuery || filterStatus !== 'All') && (
            <button onClick={() => { setSearchQuery(''); setFilterStatus('All'); }} className="text-blue-600 font-medium hover:underline">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBatches.map(batch => {
            const seatsAvailable = Math.max(0, batch.capacity - batch.enrolledStudents);
            return (
              <div key={batch._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div className="relative h-40 bg-slate-100">
                  {batch.thumbnail?.url ? (
                    <img src={batch.thumbnail?.url} alt={batch.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Image className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1" title={batch.name}>{batch.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 mb-4 line-clamp-1">
                    <BookOpen className="w-4 h-4 shrink-0" /> {batch.course?.title || 'Unknown Course'}
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 mb-5 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{batch.trainer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{batch.timing}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {new Date(batch.startDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} - {new Date(batch.endDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center mt-3 pt-3 border-t transition-all ${
                      highlightSeats 
                        ? 'border-teal-300 bg-teal-50 -mx-4 px-4 py-2 rounded-b-xl border-dashed ring-2 ring-teal-400/40' 
                        : 'border-slate-100'
                    }`}>
                      <div className="flex items-center gap-2">
                         <Users className={`w-4 h-4 ${highlightSeats ? 'text-teal-700' : 'text-slate-400'}`} />
                         <span className={highlightSeats ? 'font-bold text-teal-900' : ''}>{batch.enrolledStudents} / {batch.capacity}</span>
                      </div>
                      <span className={`text-xs font-bold ${seatsAvailable <= 3 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {seatsAvailable} Left
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-xs">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <select
                        value={batch.status}
                        onChange={(e) => handleQuickStatusChange(batch._id, e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1 bg-white font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 text-xs outline-none"
                      >
                        <option value="Active">Active (Live Now)</option>
                        <option value="Upcoming">Upcoming (Enrolling)</option>
                        <option value="Completed">Completed (Alumni)</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-auto">
                    <button onClick={() => setViewingBatch(batch)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors text-sm font-medium">
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button onClick={() => handleOpenModal(batch)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => setDeleteTarget(batch)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium">
                      <Trash2 className="w-4 h-4" /> Del
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Morning Spoken English (Sep)" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course *</label>
                  <select required name="course" value={formData.course} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                    <option value="" disabled>Select a course</option>
                    { (Array.isArray(courses) ? courses : []).map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trainer Name *</label>
                  <input required name="trainer" value={formData.trainer} onChange={handleChange} placeholder="e.g. Siyaram Kumar" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input type="date" required name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                  <input type="date" required name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                  <input type="time" required name="startTime" value={formData.startTime} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                  <input type="time" required name="endTime" value={formData.endTime} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Seats *</label>
                  <input type="number" min="1" required name="capacity" value={formData.capacity} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                  <select required name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch Thumbnail *</label>
                  <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.useDefaultThumbnail} onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          useDefaultThumbnail: e.target.checked,
                          ...(e.target.checked ? { thumbnailFile: null, thumbnailPreview: null } : {})
                        }));
                      }} className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Use Default Image</span>
                    </label>
                  </div>
                  {!formData.useDefaultThumbnail && (
                    <div className="space-y-3">
                      <input 
                        id="batch-thumbnail-input"
                        type="file" 
                        name="thumbnail" 
                        accept=".jpg,.jpeg,.png,.webp" 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                      />
                      {formData.thumbnailPreview ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <img src={formData.thumbnailPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{formData.thumbnailFile?.name || 'Selected batch thumbnail'}</p>
                            <p className="text-[11px] text-green-600 font-medium">Ready to upload to Cloudinary</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, thumbnailFile: null, thumbnailPreview: null }))}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Replace
                          </button>
                        </div>
                      ) : editingBatch && editingBatch.thumbnail?.url && !formData.thumbnailFile ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <img src={editingBatch.thumbnail.url} alt="Current" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800">Current Cloudinary Thumbnail</p>
                            <a href={editingBatch.thumbnail.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">View original</a>
                          </div>
                          <label 
                            htmlFor="batch-thumbnail-input" 
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                          >
                            Replace Image
                          </label>
                        </div>
                      ) : null}
                    </div>
                  )}
                  {formData.useDefaultThumbnail && (
                    <div className="mt-2 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                       <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644" alt="Default Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Any special notes for this batch..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingBatch ? 'Updating...' : 'Uploading & Creating...'}</span>
                    </>
                  ) : (
                    editingBatch ? 'Save Changes' : 'Create Batch'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl my-8 shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">Batch Details</h2>
              <button onClick={() => setViewingBatch(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6">
              {viewingBatch.thumbnail?.url && (
                 <img src={viewingBatch.thumbnail?.url} alt={viewingBatch.name} className="w-full h-48 object-cover rounded-xl mb-6" />
              )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">{viewingBatch.name}</h3>
                  <p className="text-blue-600 font-medium flex items-center gap-1.5">
                     <BookOpen className="w-4 h-4" /> {viewingBatch.course?.title}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(viewingBatch.status)}`}>
                  {viewingBatch.status}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 mb-6">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                     <User className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 font-medium">Trainer</p>
                     <p className="text-sm font-bold text-slate-800">{viewingBatch.trainer}</p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                    <div>
                       <p className="text-xs text-slate-500 font-medium mb-0.5">Duration</p>
                       <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         {new Date(viewingBatch.startDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} to {new Date(viewingBatch.endDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}
                       </p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 font-medium mb-0.5">Timing</p>
                       <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                         <Clock className="w-4 h-4 text-slate-400" />
                         {viewingBatch.timing}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Enrollment Status</p>
                  <p className="text-xs text-slate-500 mt-0.5">{viewingBatch.enrolledStudents} students enrolled</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{Math.max(0, viewingBatch.capacity - viewingBatch.enrolledStudents)}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Seats Left</p>
                </div>
              </div>

              {viewingBatch.description && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Description / Notes</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{viewingBatch.description}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
              <button onClick={() => setViewingBatch(null)} className="px-5 py-2.5 bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 rounded-xl transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Delete Batch</h3>
              <p className="text-slate-600 text-sm">
                Are you sure you want to delete this batch?
              </p>
              {deleteTarget.name && (
                <div className="text-xs font-semibold text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg inline-block">
                  Batch: {deleteTarget.name}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
