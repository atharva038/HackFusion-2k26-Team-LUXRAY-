const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ─── Admin: Dashboard ─────────────────────────────────────────
export const fetchDashboardStats = () => request('/admin/stats');

// ─── Admin: Orders ────────────────────────────────────────────
export const fetchOrders = () => request('/admin/orders');

export const updateOrderStatus = (id, status, rejectionReason) =>
  request(`/admin/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, rejectionReason }),
  });

// ─── Admin: Prescriptions ─────────────────────────────────────
export const fetchPrescriptions = () => request('/admin/prescriptions');

export const updatePrescription = (id, data) =>
  request(`/admin/prescriptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// ─── Admin: Inventory ─────────────────────────────────────────
export const fetchInventory = () => request('/admin/inventory');

export const restockMedicine = (id, quantity) =>
  request(`/admin/inventory/${id}/restock`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });

export const updateMedicine = (id, data) =>
  request(`/admin/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// ─── Admin: Refill Alerts ─────────────────────────────────────
export const fetchRefillAlerts = () => request('/admin/refills');

export const updateRefillAlert = (id, status) =>
  request(`/admin/refills/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// ─── Admin: Inventory Logs ────────────────────────────────────
export const fetchInventoryLogs = () => request('/admin/logs');

// ─── Chat ─────────────────────────────────────────────────────
export const sendChatMessage = (message) =>
  request('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
