import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for token refresh and blocking
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle blocking (403 suspended)
    if (error.response?.status === 403 && error.response?.data?.message?.includes('suspended')) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth?message=' + encodeURIComponent(error.response.data.message);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data;
          localStorage.setItem('token', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forget-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password })
};

// ── Users ──
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getUser: (id) => api.get(`/users/${id}`),
  searchUsers: (keyword) => api.get(`/users/search?keyword=${keyword}`),
  addSkill: (data) => api.post('/users/me/skills', data),
  removeSkill: (skillId, type) => api.delete(`/users/me/skills/${skillId}`, { data: { type } }),
};

// ── Skills ──
export const skillsAPI = {
  getAll: (keyword) => api.get(`/skills${keyword ? `?keyword=${keyword}` : ''}`),
  getMatches: () => api.get('/skills/matches'),
  getById: (id) => api.get(`/skills/${id}`),
  create: (data) => api.post('/skills', data),
};

// ── Sessions ──
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  create: (data) => api.post('/sessions', data),
  getById: (id) => api.get(`/sessions/${id}`),
  accept: (id) => api.patch(`/sessions/${id}/accept`),
  decline: (id) => api.patch(`/sessions/${id}/decline`),
  complete: (id) => api.patch(`/sessions/${id}/complete`),
  cancel: (id) => api.patch(`/sessions/${id}/cancel`),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  getPendingCount: () => api.get('/sessions/pending-count'),
};

// ── Conversations ──
export const conversationsAPI = {
  create: (participantId) => api.post('/conversations', { participantId }),
  getAll: () => api.get('/conversations'),
  getMessages: (id, page) => api.get(`/conversations/${id}/messages?page=${page || 1}`),
  sendMessage: (id, data) => api.post(`/conversations/${id}/messages`, data),
  getUnreadCount: () => api.get('/conversations/unread-count'),
  editMessage: (id, messageId, text) => api.patch(`/conversations/${id}/messages/${messageId}`, { text }),
  deleteMessage: (id, messageId) => api.delete(`/conversations/${id}/messages/${messageId}`),
  reactToMessage: (id, messageId, emoji) => api.post(`/conversations/${id}/messages/${messageId}/react`, { emoji }),
};

// ── Reviews ──
export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  getForUser: (userId) => api.get(`/reviews/user/${userId}`),
  getBySession: (sessionId) => api.get(`/reviews/session/${sessionId}`),
};

// ── Wallet ──
export const walletAPI = {
  get: () => api.get('/wallet'),
  transfer: (data) => api.post('/wallet/transfer', data),
};

// ── Notifications ──
export const notificationsAPI = {
  getAll: (page) => api.get(`/notifications?page=${page || 1}`),
  markAllRead: () => api.patch('/notifications/read-all'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markCategoryRead: (type) => api.patch(`/notifications/mark-category-read/${type}`),
};

// ── Admin ──
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  blockUser: (id) => api.patch(`/admin/users/${id}/block`),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getSkills: () => api.get('/admin/skills'),
  addSkill: (data) => api.post('/admin/skills', data),
  editSkill: (id, data) => api.put(`/admin/skills/${id}`, data),
  deleteSkill: (id) => api.delete(`/admin/skills/${id}`),
  getSessions: () => api.get('/admin/sessions'),
  getReviews: () => api.get('/admin/reviews'),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  getReports: () => api.get('/reports'),
};

export default api;
