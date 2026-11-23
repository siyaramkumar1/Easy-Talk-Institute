import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Search, Trash2, Edit, Plus, X, Award, Image as ImageIcon, Loader2 } from 'lucide-react';
import { testimonialService } from '../../services/testimonialService';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export const AdminTestimonials = () => {
  const queryClient = useQueryClient();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest First');
  const { token, user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    studentPhoto: '' as any,
    studentEmail: '',
    studentMobile: '',
    courseName: '',
    batchName: '',
    rating: 5,
    reviewTitle: '',
    reviewMessage: '',
    achievement: '',
    featured: false,
    verified: false,
    status: 'Active'
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTestimonials = async () => {
    try {
      const data = await testimonialService.getTestimonials();
      setTestimonials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleOpenModal = (testimonial?: any) => {
    if (testimonial) {
      setEditId(testimonial._id);
      setFormData(testimonial);
    } else {
      setEditId(null);
      setFormData({
        studentName: '',
        studentPhoto: '',
        studentEmail: '',
        studentMobile: '',
        courseName: '',
        batchName: '',
        rating: 5,
        reviewTitle: '',
        reviewMessage: '',
        achievement: '',
        featured: false,
        verified: false,
        status: 'Active'
      });
    }
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      setIsSubmitting(true);
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
         if (key !== 'studentPhoto') {
            submitData.append(key, (formData as any)[key]);
         }
      });
      if (thumbnailFile) {
         submitData.append('studentPhoto', thumbnailFile);
      }
      
      if (editId) {
        await testimonialService.updateTestimonial(editId, submitData, token);
        toast.success('Testimonial updated successfully', { duration: 3000 });
      } else {
        await testimonialService.createTestimonial(submitData, token);
        toast.success('Testimonial created successfully', { duration: 3000 });
      }
      setIsModalOpen(false);
      fetchTestimonials();
      queryClient.invalidateQueries({ queryKey: ['adminTestimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'active'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save testimonial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (testimonial: any) => {
    setDeleteTarget(testimonial);
  };

  const handleConfirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await testimonialService.deleteTestimonial(deleteTarget._id, token);
      toast.success('Testimonial deleted successfully', { duration: 3000 });
      setDeleteTarget(null);
      fetchTestimonials();
      queryClient.invalidateQueries({ queryKey: ['adminTestimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'active'] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete testimonial');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!token) return;
    try {
      await testimonialService.updateStatus(id, status, token);
      toast.success('Testimonial status updated successfully', { duration: 3000 });
      fetchTestimonials();
      queryClient.invalidateQueries({ queryKey: ['adminTestimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'active'] });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update testimonial status');
    }
  };

  const filteredTestimonials = testimonials
    .filter(t => statusFilter === 'All' || t.status === statusFilter)
    .filter(t => 
      t.studentName.toLowerCase().includes(search.toLowerCase()) ||
      t.courseName.toLowerCase().includes(search.toLowerCase()) ||
      (t.studentEmail && t.studentEmail.toLowerCase().includes(search.toLowerCase())) ||
      (t.studentMobile && t.studentMobile.includes(search))
    )
    .sort((a, b) => {
      if (sortOrder === 'Newest First') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'Oldest First') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'Highest Rating') return b.rating - a.rating;
      if (sortOrder === 'Lowest Rating') return a.rating - b.rating;
      if (sortOrder === 'Featured First') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });

  const stats = {
    total: testimonials.length,
    published: testimonials.filter(t => t.status === 'Active').length,
    featured: testimonials.filter(t => t.featured).length,
    avgRating: testimonials.length ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1) : '0'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Testimonials Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage student reviews and success stories.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add Testimonial
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.published}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Featured</p>
          <p className="text-2xl font-bold text-blue-600">{stats.featured}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
            {stats.avgRating} <Star className="w-4 h-4 fill-orange-500" />
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by student, course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50">
            <option value="Newest First">Newest First</option>
            <option value="Oldest First">Oldest First</option>
            <option value="Highest Rating">Highest Rating</option>
            <option value="Lowest Rating">Lowest Rating</option>
            <option value="Featured First">Featured First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600 text-sm">Student</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Course</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Rating</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Status & Badges</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Date</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTestimonials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No testimonials found</td>
                  </tr>
                ) :  (Array.isArray(filteredTestimonials) ? filteredTestimonials : []).map(t => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {(t.studentPhoto?.imageUrl || t.studentPhoto?.url || t.imageUrl || (typeof t.studentPhoto === 'string' && t.studentPhoto)) ? (
                          <img src={t.studentPhoto?.imageUrl || t.studentPhoto?.url || t.imageUrl || t.studentPhoto} alt="" aria-hidden="true" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold" aria-hidden="true">
                            {t.studentName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{t.studentName}</p>
                          {(t.studentEmail || t.studentMobile) && (
                            <p className="text-xs text-slate-500">{t.studentEmail || t.studentMobile}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 text-sm">{t.courseName}</td>
                    <td className="p-4">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-orange-400 text-orange-400' : 'fill-slate-200 text-slate-200'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <select 
                          value={t.status}
                          onChange={(e) => handleUpdateStatus(t._id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-md font-bold uppercase border-0 outline-none cursor-pointer ${
                            t.status === 'Active' ? 'bg-green-100 text-green-700' :
                            t.status === 'Inactive' ? 'bg-slate-100 text-slate-700' :
                            'bg-orange-100 text-orange-700'
                          }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                        {t.featured && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-bold uppercase">Featured</span>}
                        {t.verified && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Verified</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleOpenModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Testimonial">
                        <Edit className="w-4 h-4"/>
                      </button>
                      <button onClick={() => handleOpenDeleteModal(t)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1" title="Delete Testimonial">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredTestimonials.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No testimonials found</div>
            ) :  (Array.isArray(filteredTestimonials) ? filteredTestimonials : []).map(t => (
              <div key={t._id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {(t.studentPhoto?.imageUrl || t.studentPhoto?.url || t.imageUrl || (typeof t.studentPhoto === 'string' && t.studentPhoto)) ? (
                      <img src={t.studentPhoto?.imageUrl || t.studentPhoto?.url || t.imageUrl || t.studentPhoto} alt="" aria-hidden="true" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg" aria-hidden="true">
                        {t.studentName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800 text-lg flex items-center gap-1">{t.studentName} {t.verified && <CheckCircle className="w-4 h-4 text-green-500" />}</p>
                      <p className="text-sm text-slate-500">{t.courseName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-orange-400 text-orange-400' : 'fill-slate-200 text-slate-200'}`} />
                  ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-bold text-slate-800 text-sm mb-1">{t.reviewTitle}</p>
                  <p className="text-slate-600 text-sm line-clamp-3">"{t.reviewMessage}"</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <select 
                    value={t.status}
                    onChange={(e) => handleUpdateStatus(t._id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-md font-bold uppercase border-0 outline-none ${
                      t.status === 'Active' ? 'bg-green-100 text-green-700' :
                      t.status === 'Inactive' ? 'bg-slate-100 text-slate-700' :
                      'bg-orange-100 text-orange-700'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {t.featured && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-bold uppercase">Featured</span>}
                  
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => handleOpenModal(t)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg" title="Edit Testimonial">
                      <Edit className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleOpenDeleteModal(t)} className="p-1.5 text-red-600 bg-red-50 rounded-lg" title="Delete Testimonial">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-10">
              <h3 className="font-bold text-xl text-slate-800">{editId ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Name *</label>
                  <input required type="text" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course Name *</label>
                  <input required type="text" value={formData.courseName} onChange={e => setFormData({...formData, courseName: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={formData.studentEmail} onChange={e => setFormData({...formData, studentEmail: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                  <input type="tel" value={formData.studentMobile} onChange={e => setFormData({...formData, studentMobile: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Photo (Optional)</label>
                  <div className="space-y-3">
                    <input 
                      id="testimonial-photo-input"
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setThumbnailFile(file);
                          setThumbnailPreview(URL.createObjectURL(file));
                        }
                      }} 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                    {thumbnailPreview ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <img src={thumbnailPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{thumbnailFile?.name || 'Selected photo'}</p>
                          <p className="text-[11px] text-green-600 font-medium">Ready to upload to Cloudinary</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Replace
                        </button>
                      </div>
                    ) : (formData.studentPhoto?.imageUrl || formData.studentPhoto?.url || formData.imageUrl || (typeof formData.studentPhoto === 'string' && formData.studentPhoto)) ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <img src={formData.studentPhoto?.imageUrl || formData.studentPhoto?.url || formData.imageUrl || formData.studentPhoto} alt="Current" className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800">Current Cloudinary Photo</p>
                          <a href={formData.studentPhoto?.imageUrl || formData.studentPhoto?.url || formData.imageUrl || formData.studentPhoto} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">View original</a>
                        </div>
                        <label
                          htmlFor="testimonial-photo-input"
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                        >
                          Replace Photo
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Review Info */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-bold text-slate-800 mb-4">Review Details</h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rating *</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({...formData, rating: star})}
                          className={`p-2 rounded-lg ${formData.rating >= star ? 'bg-orange-50' : 'bg-slate-50'}`}
                        >
                          <Star className={`w-8 h-8 ${formData.rating >= star ? 'fill-orange-400 text-orange-400' : 'fill-slate-200 text-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Review Title *</label>
                    <input required type="text" value={formData.reviewTitle} onChange={e => setFormData({...formData, reviewTitle: e.target.value})} placeholder="e.g. Changed my life!" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Review Message *</label>
                    <textarea required rows={4} value={formData.reviewMessage} onChange={e => setFormData({...formData, reviewMessage: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Achievement (Success Story)</label>
                    <input type="text" value={formData.achievement} onChange={e => setFormData({...formData, achievement: e.target.value})} placeholder="e.g. Placed at MNC with 5LPA" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Status & Badges */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-bold text-slate-800 mb-4">Publishing & Badges</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="featured" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                    <label htmlFor="featured" className="font-medium text-slate-700">Featured Review</label>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="verified" checked={formData.verified} onChange={e => setFormData({...formData, verified: e.target.checked})} className="w-5 h-5 text-green-600 rounded border-slate-300 focus:ring-green-500" />
                    <label htmlFor="verified" className="font-medium text-slate-700">Verified Student</label>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editId ? 'Saving Changes...' : 'Uploading & Publishing...'}</span>
                    </>
                  ) : (
                    editId ? 'Save Changes' : 'Publish Testimonial'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Delete Testimonial</h3>
              <p className="text-slate-600 text-sm">
                Are you sure you want to delete this testimonial?
              </p>
              {deleteTarget.studentName && (
                <div className="text-xs font-semibold text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg inline-block">
                  Student: {deleteTarget.studentName} ({deleteTarget.courseName})
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
