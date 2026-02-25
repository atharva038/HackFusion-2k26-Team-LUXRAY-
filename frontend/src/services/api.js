import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharmacy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Extract data or throw clean error
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// ─── Auth ─────────────────────────────────────────────────────
export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerUser = (data) =>
  api.post('/auth/register', data);

export const fetchCurrentUser = () =>
  api.get('/auth/me');

// ─── Admin: Dashboard ─────────────────────────────────────────
export const fetchDashboardStats = () => api.get('/admin/stats');

// ─── Admin: Orders ────────────────────────────────────────────
export const fetchOrders = () => api.get('/admin/orders');

export const updateOrderStatus = (id, status, rejectionReason) =>
  api.patch(`/admin/orders/${id}`, { status, rejectionReason });

// ─── Admin: Prescriptions ─────────────────────────────────────
export const fetchPrescriptions = () => api.get('/admin/prescriptions');

export const updatePrescription = (id, data) =>
  api.patch(`/admin/prescriptions/${id}`, data);

// ─── Admin: Inventory ─────────────────────────────────────────
export const fetchInventory = () => api.get('/admin/inventory');

export const restockMedicine = (id, quantity) =>
  api.post(`/admin/inventory/${id}/restock`, { quantity });

export const updateMedicine = (id, data) =>
  api.put(`/admin/inventory/${id}`, data);

// ─── Admin: Refill Alerts ─────────────────────────────────────
export const fetchRefillAlerts = () => api.get('/admin/refills');

export const updateRefillAlert = (id, status) =>
  api.patch(`/admin/refills/${id}`, { status });

// ─── Admin: Inventory Logs ────────────────────────────────────
export const fetchInventoryLogs = () => api.get('/admin/logs');

// ─── Chat ─────────────────────────────────────────────────────
export const sendChatMessage = (message) =>
  api.post('/chat', { message });

// ─── TTS (OpenAI Voice) ──────────────────────────────────────
export const fetchTTSAudio = async (text) => {
  const token = localStorage.getItem('pharmacy_token');
  const res = await axios.post(`${BASE}/tts`, { text }, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
};
