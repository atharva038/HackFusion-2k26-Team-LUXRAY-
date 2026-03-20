import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace('/api', '') ||
  'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map(); // event → Set<callback>
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return this.socket;
    }

    if (!token || token === 'null' || token === 'undefined') {
      console.warn('[Socket] No valid token provided, skipping connection');
      return null;
    }

    console.log('[Socket] Connecting to:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    // ✅ Apply any listeners that were registered before connect() was called
    // (page-level useEffects run before SocketProvider's useEffect)
    this.reattachListeners();
    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ [Socket] Connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      // Re-apply listeners after a reconnect (socket object is reused by socket.io)
      this.reattachListeners();
    });

    this.socket.on('connection:success', (data) => {
      console.log('[Socket] Connection success:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`❌ [Socket] Disconnected: ${reason}`);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });

    this.socket.on('error:response', (data) => {
      console.error('[Socket] Server error:', data.message);
    });

    this.socket.on('pong', (data) => {
      console.log('[Socket] Pong received:', data.timestamp);
    });
  }

  // ✅ off → on (not just on) to prevent duplicates on reconnect
  reattachListeners() {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.off(event, callback);
        this.socket?.on(event, callback);
      });
    });
  }

  // ✅ Buffer the listener even when socket is null so connect() can apply it
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      // Prevent duplicates if called while connected
      this.socket.off(event, callback);
      this.socket.on(event, callback);
    }
    // else: will be applied by reattachListeners() inside connect()
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
    this.socket?.off(event, callback);
  }

  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn(`[Socket] Cannot emit ${event}: not connected`);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  // Room management
  joinRoom(roomId)  { return this.emit('join:room', roomId); }
  leaveRoom(roomId) { return this.emit('leave:room', roomId); }
  sendMessage(roomId, content, type = 'text', metadata = {}) {
    return this.emit('message:send', { roomId, content, type, metadata });
  }
  startTyping(roomId) { return this.emit('typing:start', roomId); }
  stopTyping(roomId)  { return this.emit('typing:stop', roomId); }
  ping() { return this.emit('ping'); }

  // ✅ disconnect(): closes the socket but KEEPS listeners buffered so they
  //    survive SocketContext's useEffect cleanup/re-run cycle (auth hydration).
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      // Do NOT clear this.listeners — kept so connect() can re-apply them
    }
  }

  // ✅ reset(): full teardown for logout — disconnect AND clear all listeners
  reset() {
    this.disconnect();
    this.listeners.clear();
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export default new SocketService();
