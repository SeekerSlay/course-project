import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: прикрепить access-токен ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem('access');
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: автообновление токена ───────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = localStorage.getItem('refresh');
      if (!refresh) {
        isRefreshing = false;
        localStorage.removeItem('access');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh,
        });
        localStorage.setItem('access', data.access);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// ── Products ─────────────────────────────────────────────────────────────
export const productsAPI = {
  getList: (params) => api.get('/products/', { params }),
  getDetail: (slug) => api.get(`/products/${slug}/`),
  getCategories: () => api.get('/products/categories/'),
  getFavorites: () => api.get('/products/favorites/'),
  toggleFavorite: (slug) => api.post(`/products/${slug}/toggle_favorite/`),
  getComments: (slug) => api.get(`/products/${slug}/comments/`),
  addComment: (slug, data) => api.post(`/products/${slug}/comments/`, data),
  deleteComment: (slug, id) => api.delete(`/products/${slug}/comments/${id}/`),
};

// ── Orders ────────────────────────────────────────────────────────────────
export const ordersAPI = {
  getCart: () => api.get('/orders/cart/'),
  addToCart: (data) => api.post('/orders/cart/add/', data),
  updateCartItem: (itemId, quantity) =>
    api.patch(`/orders/cart/update/${itemId}/`, { quantity }),
  removeCartItem: (itemId) => api.delete(`/orders/cart/remove/${itemId}/`),
  clearCart: () => api.delete('/orders/cart/clear/'),
  getOrders: () => api.get('/orders/'),
  getOrder: (id) => api.get(`/orders/${id}/`),
  checkout: (data) => api.post('/orders/checkout/', data),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel/`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/update_status/`, { status }),
};
