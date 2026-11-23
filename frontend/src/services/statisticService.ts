import axios from 'axios';

export interface Statistic {
  _id: string;
  section: string;
  label: string;
  value: string;
  icon?: string;
  status: 'Active' | 'Hidden';
  displayOrder: number;
}

export const statisticService = {
  getStatistics: async (params?: { section?: string, status?: string }) => {
    try {
      const res = await axios.get('/api/statistics', { params });
      const data = res.data?.success ? res.data.data : res.data;
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  createStatistic: async (statData: Partial<Statistic>) => {
    const { data } = await axios.post('/api/statistics', statData);
    return data;
  },
  updateStatistic: async (id: string, statData: Partial<Statistic>) => {
    const { data } = await axios.put(`/api/statistics/${id}`, statData);
    return data;
  },
  deleteStatistic: async (id: string) => {
    const { data } = await axios.delete(`/api/statistics/${id}`);
    return data;
  }
};
