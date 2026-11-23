import axios from 'axios';

const API_URL = '/api/gallery';

export interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  featured: boolean;
  displayOrder: number;
  status: 'Published' | 'Draft';
  createdAt: string;
}

export interface GalleryCategory {
  _id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const galleryService = {
  getGallery: async (params?: { status?: string; category?: string; featured?: boolean }) => {
    const res = await axios.get(API_URL, { params });
    const data = res.data?.success ? res.data.data : res.data;
    return Array.isArray(data) ? data as GalleryItem[] : [];
  },
  
  createGalleryItem: async (formData: FormData) => {
    const res = await axios.post(API_URL, formData, { 
      headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' } 
    });
    return res.data;
  },
  
  updateGalleryItem: async (id: string, formData: FormData) => {
    const res = await axios.put(`${API_URL}/${id}`, formData, { 
      headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' } 
    });
    return res.data;
  },
  
  deleteGalleryItem: async (id: string) => {
    const res = await axios.delete(`${API_URL}/${id}`, { headers: getHeaders() });
    return res.data;
  },

  getCategories: async () => {
    const res = await axios.get(`${API_URL}/categories`);
    const data = res.data?.success ? res.data.data : res.data;
    return Array.isArray(data) ? data as GalleryCategory[] : [];
  },
  
  createCategory: async (data: { name: string; displayOrder?: number }) => {
    const res = await axios.post(`${API_URL}/categories`, data, { headers: getHeaders() });
    return res.data;
  },
  
  updateCategory: async (id: string, data: { name?: string; displayOrder?: number }) => {
    const res = await axios.put(`${API_URL}/categories/${id}`, data, { headers: getHeaders() });
    return res.data;
  },
  
  deleteCategory: async (id: string) => {
    const res = await axios.delete(`${API_URL}/categories/${id}`, { headers: getHeaders() });
    return res.data;
  }
};
