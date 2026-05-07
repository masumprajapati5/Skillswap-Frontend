import { create } from 'zustand';
import { authAPI, usersAPI } from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: !!localStorage.getItem('token'),
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
  
  setAuth: (token, user) => {
    if (token) localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: !!user, loading: false });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.login({ email, password });
      const data = res.data;
      
      // Handle both {token, user} and {accessToken, refreshToken, user} structures
      const token = data.accessToken || data.token;
      const user = data.user || data;

      if (token) localStorage.setItem('token', token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        loading: false,
        error: null
      });
      await useAuthStore.getState().loadUser();
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid credentials';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.register({ name, email, password });
      const data = res.data;

      const token = data.accessToken || data.token;
      const user = data.user || data;

      if (token) localStorage.setItem('token', token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        loading: false,
        error: null
      });
      await useAuthStore.getState().loadUser();
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },


  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, isAuthenticated: false, error: null, loading: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      // Only set loading to true if we don't already have a user (first load)
      if (!useAuthStore.getState().isAuthenticated) {
        set({ loading: true });
      }
      try {
        const res = await usersAPI.getMe();
        set({ user: res.data, token, isAuthenticated: true, loading: false });
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;


