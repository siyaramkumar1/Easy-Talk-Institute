import axios from 'axios';

const API_URL = '/api/testimonials';

export const testimonialService = {
  createTestimonial: async (data: any, token: string) => {
    const response = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getTestimonials: async (params?: any) => {
    const response = await axios.get(API_URL, { params });
    const data = response.data?.success ? response.data.data : response.data;
    return Array.isArray(data) ? data : [];
  },

  getTestimonial: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  updateTestimonial: async (id: string, data: any, token: string) => {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteTestimonial: async (id: string, token: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
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

  verifyStudent: async (id: string, verified: boolean, token: string) => {
    const response = await axios.patch(`${API_URL}/${id}/verify`, { verified }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
