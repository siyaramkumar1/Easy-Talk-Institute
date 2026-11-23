import axios from 'axios';

const API_URL = '/api/reading';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || '';
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export interface Story {
  _id: string;
  titleEnglish: string;
  titleHindi: string;
  englishContent?: string;
  hindiContent?: string;
  shortDescription?: string;
  difficultyLevel: 'Beginner' | 'Elementary' | 'Easy' | 'Intermediate' | 'Advanced' | 'Hard';
  displayOrder: number;
  status: 'Draft' | 'Published' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface StoryNavigation {
  previousStory: { _id: string; titleEnglish: string; difficultyLevel: string } | null;
  nextStory: { _id: string; titleEnglish: string; difficultyLevel: string } | null;
  isFirst: boolean;
  isLast: boolean;
  totalInLevel?: number;
  currentStoryIndex?: number;
  totalPublished?: number;
}

export interface StoryProgressData {
  currentPage: 'english' | 'hindi';
  pageCompleted: boolean;
  storyCompleted: boolean;
  lastReadPosition: number;
  completedAt?: string | null;
}

export interface ProgressSummary {
  continueReading: {
    story: {
      _id: string;
      titleEnglish: string;
      titleHindi: string;
      difficultyLevel: string;
    };
    progress: StoryProgressData;
  } | null;
  completedStoryIds: string[];
  totalCompleted: number;
  totalStories: number;
  currentLevel: string;
  hasStarted?: boolean;
  progressByStoryId?: Record<string, { currentPage: string; pageCompleted: boolean; storyCompleted: boolean }>;
}

export const readingService = {
  // Public
  getPublicStories: async (): Promise<Story[]> => {
    const res = await axios.get(`${API_URL}/stories`);
    return Array.isArray(res.data) ? res.data : [];
  },

  getStoryById: async (id: string): Promise<{ story: Story; navigation: StoryNavigation }> => {
    const res = await axios.get(`${API_URL}/stories/${id}`, getAuthHeaders());
    return res.data;
  },

  // Student progress
  getProgressSummary: async (): Promise<ProgressSummary> => {
    const res = await axios.get(`${API_URL}/progress/summary`, getAuthHeaders());
    return res.data;
  },

  getStoryProgress: async (storyId: string): Promise<StoryProgressData> => {
    const res = await axios.get(`${API_URL}/progress/${storyId}`, getAuthHeaders());
    return res.data;
  },

  saveStoryProgress: async (
    storyId: string,
    data: { currentPage?: 'english' | 'hindi'; pageCompleted?: boolean; lastReadPosition?: number }
  ) => {
    const res = await axios.post(`${API_URL}/progress/${storyId}`, data, getAuthHeaders());
    return res.data;
  },

  completeStory: async (storyId: string) => {
    const res = await axios.post(`${API_URL}/progress/${storyId}/complete`, {}, getAuthHeaders());
    return res.data;
  },

  // Admin
  getAdminStories: async (params?: { status?: string; difficultyLevel?: string; search?: string }): Promise<Story[]> => {
    const res = await axios.get(`${API_URL}/admin/stories`, {
      ...getAuthHeaders(),
      params
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  createStory: async (storyData: Partial<Story>) => {
    const res = await axios.post(`${API_URL}/admin/stories`, storyData, getAuthHeaders());
    return res.data;
  },

  updateStory: async (id: string, storyData: Partial<Story>) => {
    const res = await axios.put(`${API_URL}/admin/stories/${id}`, storyData, getAuthHeaders());
    return res.data;
  },

  updateStoryStatus: async (id: string, status: 'Draft' | 'Published' | 'Inactive') => {
    const res = await axios.patch(`${API_URL}/admin/stories/${id}/status`, { status }, getAuthHeaders());
    return res.data;
  },

  deleteStory: async (id: string) => {
    const res = await axios.delete(`${API_URL}/admin/stories/${id}`, getAuthHeaders());
    return res.data;
  }
};
