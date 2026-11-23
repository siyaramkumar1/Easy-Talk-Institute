import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, CheckCircle, XCircle, Image as ImageIcon, Star, Filter, Loader2 } from 'lucide-react';
import { galleryService, GalleryItem, GalleryCategory } from '../../services/galleryService';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export const AdminGallery = () => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('Published');
  const [featured, setFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gData, cData] = await Promise.all([
        galleryService.getGallery(),
        galleryService.getCategories()
      ]);
      setItems(gData);
      setCategories(cData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(categories.length > 0 ? categories[0].name : '');
    setStatus('Published');
    setFeatured(false);
    setDisplayOrder(0);
    setImageFile(null);
    setImagePreview('');
    setEditingItem(null);
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setCategory(item.category);
    setStatus(item.status);
    setFeatured(item.featured);
    setDisplayOrder(item.displayOrder);
    setImagePreview(item.imageUrl);
    setImageFile(null);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await galleryService.deleteGalleryItem(deleteTarget._id);
      toast.success('Gallery item deleted successfully', { duration: 3000 });
      setDeleteTarget(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['publicGallery'] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem && !imageFile) {
      toast.error('Please select an image');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('status', status);
      formData.append('featured', String(featured));
      formData.append('displayOrder', String(displayOrder));
      if (imageFile) formData.append('image', imageFile);

      if (editingItem) {
        await galleryService.updateGalleryItem(editingItem._id, formData);
        toast.success('Gallery item updated successfully', { duration: 3000 });
      } else {
        await galleryService.createGalleryItem(formData);
        toast.success('Gallery item created successfully', { duration: 3000 });
      }
      setShowModal(false);
      resetForm();
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['publicGallery'] });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save gallery item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: GalleryItem) => {
    try {
      const newStatus = item.status === 'Published' ? 'Draft' : 'Published';
      const formData = new FormData();
      formData.append('title', item.title);
      formData.append('category', item.category);
      formData.append('status', newStatus);
      await galleryService.updateGalleryItem(item._id, formData);
      toast.success('Gallery item status updated successfully', { duration: 3000 });
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['publicGallery'] });
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await galleryService.createCategory({ name: catName, displayOrder: catOrder });
      toast.success('Category created successfully', { duration: 3000 });
      setCatName('');
      setCatOrder(0);
      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await galleryService.deleteCategory(id);
      toast.success('Category deleted successfully', { duration: 3000 });
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['gallery'] }); queryClient.invalidateQueries({ queryKey: ['publicGallery'] });
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Gallery Management</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowCategoryModal(true)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200">
            <Filter className="w-4 h-4" /> Categories
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600">
            <Plus className="w-4 h-4" /> Upload Image
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                <th className="p-4 font-medium">Image</th>
                <th className="p-4 font-medium">Title & Category</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Array.isArray(items) ? items : []).map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <img src={item.imageUrl} alt={item.title} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {item.title} 
                      {item.featured && <Star className="w-4 h-4 text-orange-400 fill-orange-400" />}
                    </div>
                    <div className="text-sm text-slate-500">{item.category}</div>
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      title="Click to toggle status"
                      className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase transition-transform active:scale-95 ${item.status === 'Published' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700 mr-3"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(item)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="p-8 text-center text-slate-500">No gallery items found.</div>}
        </div>
      )}

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Gallery Item' : 'Upload Image'}</h2>
              <button onClick={() => setShowModal(false)}><XCircle className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded" />
                  
                  <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} required className="w-full p-2 border rounded">
                    <option value="">Select Category</option>
                    {(Array.isArray(categories) ? categories : []).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>

                  <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded" rows={3}></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
                  <div className="space-y-3">
                    <input 
                      id="gallery-file-input"
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleImageChange} 
                      className="w-full p-2 border rounded text-sm file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                    {imagePreview && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200">
                        <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                        <div className="p-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{imageFile?.name || 'Selected image'}</span>
                          <button
                            type="button"
                            onClick={() => { setImageFile(null); setImagePreview(editingItem?.imageUrl || ''); }}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 border rounded">
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                      <input type="number" value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} className="w-full p-2 border rounded" />
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Feature this image</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded font-medium flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading & Saving...</span>
                    </>
                  ) : (
                    'Save Item'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <h2 className="text-xl font-bold">Manage Categories</h2>
              <button onClick={() => setShowCategoryModal(false)}><XCircle className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-6">
                <input type="text" placeholder="New Category Name" value={catName} onChange={e => setCatName(e.target.value)} required className="flex-1 p-2 border rounded" />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
              </form>
              
              <ul className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {(Array.isArray(categories) ? categories : []).map(c => (
                  <li key={c._id} className="py-3 flex justify-between items-center">
                    <span className="font-medium text-slate-800">{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c._id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
                {categories.length === 0 && <li className="py-4 text-center text-slate-500">No categories found</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Delete Gallery Item</h3>
              <p className="text-slate-600 text-sm">
                Are you sure you want to delete this gallery item? This will remove the image from Cloudinary as well.
              </p>
              {deleteTarget.title && (
                <div className="text-xs font-semibold text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg inline-block">
                  Title: {deleteTarget.title}
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
