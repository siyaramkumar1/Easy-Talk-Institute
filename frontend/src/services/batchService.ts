import axios from 'axios';

const API_URL = '/api/batches';

export const batchService = {
  getPublic: async (status?: string) => {
    const url = status && status.toLowerCase() !== 'all'
      ? `${API_URL}/public?status=${encodeURIComponent(status)}`
      : `${API_URL}/public`;
    const response = await axios.get(url);
    const data = response.data?.success ? response.data.data : response.data;
    return Array.isArray(data) ? data : [];
  },
  
  getAll: async (status?: string) => {
    const url = status && status.toLowerCase() !== 'all'
      ? `${API_URL}?status=${encodeURIComponent(status)}`
      : API_URL;
    const response = await axios.get(url);
    const data = response.data?.success ? response.data.data : response.data;
    return Array.isArray(data) ? data : [];
  },
  
  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },
  
  create: async (data: any, token: string) => {
    const response = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
  
  update: async (id: string, data: any, token: string) => {
    const response = await axios.put(`${API_URL}/${id}`, data, {
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
