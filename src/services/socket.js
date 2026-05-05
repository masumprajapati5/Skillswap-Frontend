import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
  }
  getSocket() {
    return this.socket;
  }

  connect(userId) {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false
    });

    this.socket.on('connect', () => {
      if (userId) {
        this.socket.emit('join_user_room', userId);
      }
    });

    this.socket.on('disconnect', () => {
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  sendMessage(data) {
    if (this.socket) {
      this.socket.emit('send_message', data);
    }
  }

  onMessageReceived(callback) {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
  }

  offMessageReceived(callback) {
    if (this.socket) {
      this.socket.off('receive_message', callback);
    }
  }

  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  onOnlineUsersUpdate(callback) {
    if (this.socket) {
      this.socket.on('get_online_users', callback);
    }
  }

  offOnlineUsersUpdate(callback) {
    if (this.socket) {
      this.socket.off('get_online_users', callback);
    }
  }

  requestOnlineUsers() {
    if (this.socket) {
      this.socket.emit('request_online_users');
    }
  }
}

const socketService = new SocketService();
export default socketService;
