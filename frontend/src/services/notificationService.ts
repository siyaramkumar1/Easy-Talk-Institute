import axios from 'axios';

const API_URL = '/api/notifications';

export const notificationService = {
  create: async (data: any, token: string) => {
    const response = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getHistory: async (token: string) => {
    const response = await axios.get(`${API_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getStats: async (id: string, token: string) => {
    const response = await axios.get(`${API_URL}/stats/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getUserNotifications: async (userId: string, token: string) => {
    const response = await axios.get(`${API_URL}/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  markAsRead: async (id: string, token: string) => {
    const response = await axios.put(`${API_URL}/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  markAllAsRead: async (token: string) => {
    const response = await axios.put(`${API_URL}/read-all`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  delete: async (id: string, token: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  resend: async (id: string, token: string) => {
    const response = await axios.post(`${API_URL}/resend/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
