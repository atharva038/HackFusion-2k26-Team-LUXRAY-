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
    const status = err.response?.status;
    const message = err.response?.data?.error || err.message || 'Request failed';
    // Surface rate limit errors with clear context
    if (status === 429) {
      return Promise.reject(new Error('Too many requests. Please wait a moment before trying again.'));
    }
    // Auto-redirect on session expiry (401) is handled per-feature, not globally,
    // to avoid redirect loops on the login page.
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
export const sendChatMessage = (message, sessionId) =>
  api.post('/chat', { message, sessionId });

export const fetchChatSessions = () => api.get('/chat/sessions');

export const fetchChatHistory = (sessionId) => api.get(`/chat/history/${sessionId}`);

export const deleteChatSession = (sessionId) => api.delete(`/chat/sessions/${sessionId}`);

/**
 * streamChatMessage — SSE-based streaming chat.
 * Returns an EventSource that emits { chunk: string } events and a final { done: true } event.
 *
 * @param {string} sessionId
 * @param {{ onChunk: (text: string) => void, onDone: (blocked: boolean, sessionId?: string) => void, onError: (msg: string) => void }} handlers
 * @returns {EventSource} — call .close() to manually stop
 */
export const streamChatMessage = (message, sessionId, { onChunk, onDone, onError }) => {
  const token = localStorage.getItem('pharmacy_token');
  const urlParams = new URLSearchParams({ message, token: token || '' });
  if (sessionId) urlParams.append('sessionId', sessionId);
  
  const url = `${BASE}/chat/stream?${urlParams.toString()}`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.error) {
        onError?.(data.error);
        es.close();
      } else if (data.done) {
        onDone?.(data.blocked || false, data.sessionId);
        es.close();
      } else if (data.chunk) {
        onChunk?.(data.chunk);
      }
    } catch (e) {
      // Ignore malformed events
    }
  };

  es.onerror = () => {
    onError?.('Connection error. Please try again.');
    es.close();
  };

  return es;
};

// ─── TTS (OpenAI Voice) ──────────────────────────────────────

/**
 * Fetch TTS audio as a blob (streaming endpoint — low latency).
 * Falls back to the legacy buffered endpoint if streaming fails.
 */
export const fetchTTSAudio = async (text) => {
  const token = localStorage.getItem('pharmacy_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    // Try streaming endpoint first (lower latency)
    const res = await fetch(`${BASE}/tts/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error(`TTS stream failed: ${res.status}`);
    return await res.blob();
  } catch (streamErr) {
    console.warn('[TTS] Stream failed, falling back to buffered:', streamErr.message);
    // Fallback to legacy buffered endpoint
    const res = await axios.post(`${BASE}/tts`, { text }, {
      responseType: 'blob',
      headers,
    });
    return res.data;
  }
};

/**
 * Split text into sentence-level chunks for faster TTS playback.
 * Returns array of non-empty sentence strings.
 */
export const splitIntoSentences = (text) => {
  if (!text || typeof text !== 'string') return [text || ''];

  // Split on sentence-ending punctuation, keeping the punctuation
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g);

  if (!sentences || sentences.length === 0) return [text.trim()];

  // Trim each sentence and filter empty ones
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
};

/**
 * Fetch TTS for multiple sentences in parallel, returning an array of blob promises.
 * The first sentence starts fetching immediately; subsequent sentences are pre-fetched.
 * Caller can await them sequentially for back-to-back playback.
 */
export const fetchTTSChunked = (sentences) => {
  // Fire all fetches in parallel — returns array of Promises<Blob>
  return sentences.map(sentence => fetchTTSAudio(sentence));
};
