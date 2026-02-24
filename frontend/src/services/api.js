/**
 * API Service Layer
 * Centralizes all backend communication for the Agentic AI Pharmacy System.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Generic fetch wrapper with error handling */
async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'API request failed');
  }
  return res.json();
}

// ─── Chat ────────────────────────────────────────
export const chatAPI = {
  sendMessage: (text) => request('/chat', { method: 'POST', body: JSON.stringify({ message: text }) }),
  getHistory: () => request('/chat/history'),
};

// ─── Inventory ───────────────────────────────────
export const inventoryAPI = {
  getAll: () => request('/admin/inventory'),
  update: (id, data) => request(`/admin/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Orders ──────────────────────────────────────
export const ordersAPI = {
  getAll: () => request('/admin/orders'),
  updateStatus: (id, status) => request(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── Refill Alerts ───────────────────────────────
export const refillAPI = {
  getAlerts: () => request('/admin/refills'),
};

// ─── AI Trace ────────────────────────────────────
export const traceAPI = {
  getTraces: () => request('/admin/traces'),
};
