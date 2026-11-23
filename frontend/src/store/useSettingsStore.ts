import { create } from 'zustand';
import axios from 'axios';

interface SettingsState {
  settings: any;
  loading: boolean;
  hasLoaded: boolean;
  fetchSettings: (force?: boolean) => Promise<void>;
  setSettings: (newSettings: any) => void;
}

let isFetching = false;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loading: true,
  hasLoaded: false,
  setSettings: (newSettings: any) => {
    set({ settings: newSettings || {}, hasLoaded: true, loading: false });
  },
  fetchSettings: async (force: boolean = false) => {
    // Prevent duplicate concurrent or repeated fetches once loaded unless forced
    if (!force && (get().hasLoaded || isFetching)) return;
    isFetching = true;
    try {
      const res = await axios.get('/api/settings');
      set({ settings: res.data || {}, loading: false, hasLoaded: true });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ loading: false });
    } finally {
      isFetching = false;
    }
  },
}));
