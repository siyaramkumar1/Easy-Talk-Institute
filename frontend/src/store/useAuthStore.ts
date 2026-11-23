import { create } from 'zustand';
import { User } from '../types';
import axios from 'axios';
import { disconnectAppSocket } from '../utils/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  authLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void> | void;
  checkAuth: () => Promise<void>;
}

// Clear any legacy Web Storage credentials so no tokens/secrets persist in localStorage or sessionStorage
try {
  ['token', 'user', 'auth_token', 'accessToken', 'currentUser', 'authUser'].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
} catch {
  // Ignore storage access errors in restricted environments
}

// Always send HttpOnly session cookies and CSRF protection header with requests
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const INVALID_BEARER_VALUES = new Set([
  '',
  'Bearer',
  'Bearer ',
  'Bearer null',
  'Bearer undefined',
  'Bearer cookie-session',
]);

// Request interceptor: sanitize placeholder/null Bearer headers so HttpOnly cookie auth works seamlessly
axios.interceptors.request.use((config) => {
  config.withCredentials = true;

  const headers: any = config.headers || {};
  if (typeof headers.set === 'function') {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  } else {
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }

  const currentAuth =
    typeof headers.get === 'function' ? headers.get('Authorization') : headers.Authorization || headers.authorization;
  const inMemoryToken = useAuthStore.getState().token;
  const hasRealJwt = Boolean(inMemoryToken && inMemoryToken !== 'cookie-session');

  if (!currentAuth || INVALID_BEARER_VALUES.has(String(currentAuth).trim())) {
    if (hasRealJwt) {
      if (typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${inMemoryToken}`);
      } else {
        headers.Authorization = `Bearer ${inMemoryToken}`;
      }
    } else {
      if (typeof headers.delete === 'function') {
        headers.delete('Authorization');
      } else {
        delete headers.Authorization;
        delete headers.authorization;
      }
    }
  }

  config.headers = headers;
  return config;
});

// Response interceptor: clear in-memory session on 401 token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const url = String(error.config?.url || '');
      if (
        !url.includes('/api/auth/login') &&
        !url.includes('/api/auth/register') &&
        !url.includes('/api/auth/me')
      ) {
        delete axios.defaults.headers.common['Authorization'];
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          token: null,
          isLoading: false,
          authLoading: false,
        });
      }
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  isLoading: true,
  authLoading: true,

  login: (user, token) => {
    // Store session token strictly in memory (never in localStorage or sessionStorage)
    disconnectAppSocket();
    const memoryToken = token || 'cookie-session';
    if (token && token !== 'cookie-session') {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    set({
      user,
      isAuthenticated: true,
      token: memoryToken,
      isLoading: false,
      authLoading: false,
    });
  },

  logout: async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error', err);
    }
    disconnectAppSocket();
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    } catch {
      // Ignore storage access errors
    }
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, isAuthenticated: false, token: null, isLoading: false, authLoading: false });
  },

  checkAuth: async () => {
    if (!get().user) {
      set({ authLoading: true, isLoading: true });
    }

    try {
      const response = await axios.get('/api/auth/me', { withCredentials: true });
      const userData = response.data;
      if (!userData || (!userData.id && !userData._id)) {
        throw new Error('Invalid session user');
      }
      const existingToken = get().token;
      set({
        user: userData,
        isAuthenticated: true,
        token: existingToken || 'cookie-session',
        isLoading: false,
        authLoading: false,
      });
    } catch {
      delete axios.defaults.headers.common['Authorization'];
      set({
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        authLoading: false,
      });
    }
  },
}));
