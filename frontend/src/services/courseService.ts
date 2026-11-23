import axios from 'axios';

const API_URL = '/api/courses';

export const courseService = {
  getAll: async (status?: string) => {
    const url = status ? `${API_URL}?status=${status}` : API_URL;
    const response = await axios.get(url);
    const data = response.data?.success ? response.data.data : response.data;
    return Array.isArray(data) ? data : [];
  },
  
  getBySlug: async (slug: string) => {
    const response = await axios.get(`${API_URL}/${slug}`);
    return response.data;
  },
  
  create: async (data: FormData, token: string) => {
    const response = await axios.post(API_URL, data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  update: async (id: string, data: FormData, token: string) => {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  updateStatus: async (id: string, status: string, token: string) => {
    const response = await axios.patch(`${API_URL}/${id}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateFeature: async (id: string, featured: boolean, token: string) => {
    const response = await axios.patch(`${API_URL}/${id}/feature`, { featured }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  delete: async (id: string, token: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
