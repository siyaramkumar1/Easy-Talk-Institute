import { useAuthStore } from '../../store/useAuthStore';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Eye, BarChart2, Star, Loader2, BookOpen } from 'lucide-react';
import { courseService } from '../../services/courseService';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const AdminCourses = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [sortOption, setSortOption] = useState('Latest');

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    instructor: '',
    price: 0,
    discountPrice: 0,
    duration: '',
    level: '',
    language: '',
    status: 'Draft',
    features: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [useDefaultThumbnail, setUseDefaultThumbnail] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { data: courses = [], isLoading: loading } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: async () => {
      return await courseService.getAll('all');
    }
  });

  // Automatically open course edit modal if navigated with ?edit=ID, ?id=ID, or /admin/courses/:id
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pathParts = location.pathname.split('/courses/');
    const pathId = pathParts.length > 1 && pathParts[1] ? pathParts[1].split('/')[0] : null;
    const courseId = params.get('edit') || params.get('id') || pathId;
    if (courseId && courses.length > 0) {
      const found = courses.find((c: any) => c._id === courseId || c.slug === courseId);
      if (found) {
        handleOpenModal(found);
      }
    }
  }, [location.search, location.pathname, courses]);

  const handleOpenModal = (course: any = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title || '',
        shortDescription: course.shortDescription || '',
        fullDescription: course.fullDescription || course.description || '',
        instructor: course.instructor || '',
        price: course.price || 0,
        discountPrice: course.discountPrice || 0,
        duration: course.duration || '',
        level: course.level || '',
        language: course.language || '',
        status: course.status || 'Draft',
        features: course.features ? course.features.join('\n') : ''
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        shortDescription: '',
        fullDescription: '',
        instructor: '',
        price: 0,
        discountPrice: 0,
        duration: '',
        level: '',
        language: '',
        status: 'Draft',
        features: ''
      });
    }
    setThumbnailFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setUseDefaultThumbnail(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token') || '';
      
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
         if (key === 'features') {
            submitData.append(key, JSON.stringify((value as string).split('\n').filter(f => f.trim() !== '')));
         } else {
            submitData.append(key, value as string);
         }
      });
      submitData.append('description', formData.fullDescription);
      
      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      } else if (useDefaultThumbnail) {
        submitData.append('defaultThumbnail', 'true');
      } else if (!editingCourse) {
         toast.error("Course thumbnail is required");
         setIsSubmitting(false);
         return;
      }

      if (editingCourse) {
        await courseService.update(editingCourse._id, submitData, token);
        toast.success('Course updated successfully', { duration: 3000 });
      } else {
        await courseService.create(submitData, token);
        toast.success('Course created successfully', { duration: 3000 });
      }
      
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch (err: any) {
      console.error(err);
      toast.error("Error saving course: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token') || '';
      await courseService.delete(deleteTarget._id, token);
      toast.success('Course deleted successfully', { duration: 3000 });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (course: any) => {
    try {
      const token = localStorage.getItem('token') || '';
      const newStatus = course.status === 'Draft' ? 'Active' : (course.status === 'Active' ? 'Inactive' : 'Active');
      await courseService.updateStatus(course._id, newStatus, token);
      toast.success('Course status updated successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  const toggleFeatured = async (course: any) => {
    try {
      const token = localStorage.getItem('token') || '';
      await courseService.updateFeature(course._id, !course.featured, token);
      toast.success('Course feature updated successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch (err) {
      toast.error("Error updating feature status");
    }
  };

  const filteredAndSortedCourses = courses
    .filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All' || c.status.toLowerCase() === filterStatus.toLowerCase();
      const matchesLevel = filterLevel === 'All' || c.level.toLowerCase().includes(filterLevel.toLowerCase());
      return matchesSearch && matchesStatus && matchesLevel;
    })
    .sort((a, b) => {
      if (sortOption === 'Latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOption === 'Oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === 'Price Low-High') return a.price - b.price;
      if (sortOption === 'Price High-Low') return b.price - a.price;
      return 0;
    });

  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.status === 'Active').length;
  const draftCourses = courses.filter(c => c.status === 'Draft').length;
  const featuredCourses = courses.filter(c => c.featured).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Course Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage and publish all your platform courses.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium">
          <Plus className="w-5 h-5" /> Add Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-800">{totalCourses}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600"><BookOpen className="w-5 h-5"/></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-green-600 font-medium uppercase mb-1">Active</p>
            <p className="text-2xl font-bold text-slate-800">{publishedCourses}</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600"><Eye className="w-5 h-5"/></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase mb-1">Drafts</p>
            <p className="text-2xl font-bold text-slate-800">{draftCourses}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600"><Edit className="w-5 h-5"/></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-orange-600 font-medium uppercase mb-1">Featured</p>
            <p className="text-2xl font-bold text-slate-800">{featuredCourses}</p>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><Star className="w-5 h-5"/></div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by course name or instructor..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 bg-white">
            <option value="All">All Status</option>
            <option value="Active">Active</option>\n            <option value="Inactive">Inactive</option>
            <option value="Draft">Draft</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 bg-white">
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 bg-white">
            <option value="Latest">Latest</option>
            <option value="Oldest">Oldest</option>
            <option value="Price Low-High">Price Low-High</option>
            <option value="Price High-Low">Price High-Low</option>
          </select>
        </div>
      </div>

      {/* Course List - Mobile First Cards */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredAndSortedCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No courses found</h3>
          <p className="text-slate-500 mb-6">Create your first course to start teaching.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedCourses.map(course => (
            <div key={course._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group relative hover:shadow-md transition-shadow">
               <div className="relative h-48 bg-slate-100">
                  <img src={course.thumbnail?.url || course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-white shadow-sm ${course.status === 'Active' ? 'text-green-600 border-green-200' : 'text-slate-600 border-slate-200'}`}>
                      {course.status}
                    </span>
                    {course.featured && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-orange-100 text-orange-700 border-orange-200 shadow-sm">
                        <Star className="w-3 h-3 fill-current" /> Featured
                      </span>
                    )}
                  </div>
               </div>
               
               <div className="p-5 flex-1 flex flex-col">
                 <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-2" title={course.title}>{course.title}</h3>
                 <p className="text-sm text-slate-600 mb-3">{course.instructor}</p>
                 
                 <div className="flex items-center gap-2 mb-4">
                    <span className="font-bold text-lg">₹{course.discountPrice > 0 ? course.discountPrice : course.price}</span>
                    {course.discountPrice > 0 && <span className="text-sm text-slate-400 line-through">₹{course.price}</span>}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button onClick={() => toggleStatus(course)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${course.status === 'Active' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {course.status === 'Draft' ? 'Activate' : (course.status === 'Active' ? 'Deactivate' : 'Activate')}
                    </button>
                    <button onClick={() => toggleFeatured(course)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${course.featured ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                      {course.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button onClick={() => navigate(`/course/${course.slug || course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`)} className="py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button onClick={() => handleOpenModal(course)} className="py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => setDeleteTarget(course)} className="py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course Title *</label>
                  <input required name="title" value={formData.title} onChange={handleChange} minLength={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instructor *</label>
                  <input required name="instructor" value={formData.instructor} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level *</label>
                  <select required name="level" value={formData.level} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                    <option value="" disabled>Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹) *</label>
                  <input type="number" min="0" required name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount Price (₹)</label>
                  <input type="number" min="0" name="discountPrice" value={formData.discountPrice} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration *</label>
                  <input required name="duration" placeholder="e.g. 3 Months" value={formData.duration} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Language *</label>
                  <input required name="language" placeholder="e.g. English" value={formData.language} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course Thumbnail *</label>
                  <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={useDefaultThumbnail} onChange={e => {
                        setUseDefaultThumbnail(e.target.checked);
                        if (e.target.checked) {
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }
                      }} className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Use Default Image</span>
                    </label>
                  </div>
                  {!useDefaultThumbnail && (
                    <div className="space-y-3">
                      <input 
                        id="course-thumbnail-input"
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        onChange={handleFileChange} 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                      />
                      {thumbnailPreview ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <img src={thumbnailPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{thumbnailFile?.name || 'Selected image'}</p>
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
                      ) : editingCourse && editingCourse.thumbnail?.url && !thumbnailFile ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <img src={editingCourse.thumbnail.url} alt="Current" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800">Current Cloudinary Thumbnail</p>
                            <a href={editingCourse.thumbnail.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">View original</a>
                          </div>
                          <label 
                            htmlFor="course-thumbnail-input" 
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                          >
                            Replace Image
                          </label>
                        </div>
                      ) : null}
                    </div>
                  )}
                  {useDefaultThumbnail && (
                    <div className="mt-2 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                       <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644" alt="Default Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Short Description *</label>
                  <input required name="shortDescription" minLength={10} value={formData.shortDescription} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Description *</label>
                  <textarea required name="fullDescription" minLength={20} value={formData.fullDescription} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Features (One per line)</label>
                  <textarea name="features" value={formData.features} onChange={handleChange} rows={4} placeholder="Course Completion&#10;Live Classes&#10;Mock Tests" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                      <span>{editingCourse ? 'Updating...' : 'Uploading & Creating...'}</span>
                    </>
                  ) : (
                    editingCourse ? 'Update Course' : 'Save Course'
                  )}
                </button>
              </div>
            </form>
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
              <h3 className="text-xl font-bold text-slate-800">Delete Course</h3>
              <p className="text-slate-600 text-sm">
                Are you sure you want to delete this course?
              </p>
              {deleteTarget.title && (
                <div className="text-xs font-semibold text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg inline-block">
                  Course: {deleteTarget.title}
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
