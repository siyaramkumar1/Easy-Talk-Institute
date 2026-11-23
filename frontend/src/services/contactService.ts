import axios from 'axios';

const API_URL = '/api/contact';

const buildAuthConfig = (token?: string) => {
  return token && token !== 'cookie-session'
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
};

export const contactService = {
  submitInquiry: async (data: any) => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  getInquiries: async (token?: string) => {
    const response = await axios.get(API_URL, buildAuthConfig(token));
    return response.data;
  },

  getInquiry: async (id: string, token?: string) => {
    const response = await axios.get(`${API_URL}/${id}`, buildAuthConfig(token));
    return response.data;
  },

  getMyInquiry: async (id: string) => {
    const response = await axios.get(`${API_URL}/my/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string, token?: string) => {
    const response = await axios.put(`${API_URL}/${id}/status`, { status }, buildAuthConfig(token));
    return response.data;
  },

  replyInquiry: async (id: string, adminReply: string, token?: string) => {
    const response = await axios.post(`${API_URL}/${id}/reply`, { adminReply }, buildAuthConfig(token));
    return response.data;
  },

  associateUser: async (
    id: string,
    payload: { userId?: string; deliverExistingReplies?: boolean } = {},
    token?: string
  ) => {
    const response = await axios.put(`${API_URL}/${id}/associate-user`, payload, buildAuthConfig(token));
    return response.data;
  },

  deleteInquiry: async (id: string, token?: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, buildAuthConfig(token));
    return response.data;
  }
};
