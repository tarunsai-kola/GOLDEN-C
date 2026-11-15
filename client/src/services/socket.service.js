import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    const token = localStorage.getItem('gc_token');
    if (!token) return null;

    if (this.socket?.connected) {
      return this.socket;
    }

    // Connect to server: use VITE_SOCKET_URL, or VITE_API_URL, or fallback
    const envSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    const socketUrl = envSocketUrl
      ? envSocketUrl.replace(/\/+$/, '')
      : (window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin);

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      // Re-register any pending listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => this.socket.on(event, cb));
      });
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected. Cannot emit "${event}".`);
    }
  }

  sendTyping(conversationId, isTyping) {
    this.emit('message:typing', { conversationId, isTyping });
  }

  joinRoom(room) {
    this.emit('room:join', { room });
  }

  leaveRoom(room) {
    this.emit('room:leave', { room });
  }
}

export const socketService = new SocketService();
export default socketService;
