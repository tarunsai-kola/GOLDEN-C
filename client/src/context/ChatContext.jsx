import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import chatService from '../services/chat.service';
import socketService from '../services/socket.service';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingMap, setTypingMap] = useState({}); // { [conversationId]: Set<userId> }

  const activeConvRef = useRef(activeConversation);
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Fetch unread messages count
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await chatService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore
    }
  }, [isAuthenticated]);

  // Fetch all conversations
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingConversations(true);
    try {
      const data = await chatService.getConversations();
      const list = Array.isArray(data) ? data : data.conversations || [];
      setConversations(list);
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const data = await chatService.getMessages(conversationId);
      const list = Array.isArray(data) ? data : data.messages || [];
      setMessages(list);

      // Mark read
      await chatService.markAsRead(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
      refreshUnreadCount();
    } catch (err) {
      console.warn('Failed to load messages for conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [refreshUnreadCount]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketService.disconnect();
      return;
    }

    const socket = socketService.connect();
    if (!socket) return;

    // Listen to new messages
    const offNewMessage = socketService.on('message:new', (newMsg) => {
      const convId = newMsg.conversationId || newMsg.conversation?._id || newMsg.conversation;
      const currentActive = activeConvRef.current;

      if (currentActive && (currentActive._id === convId || currentActive.id === convId)) {
        // Append to active message feed
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        chatService.markAsRead(convId);
      } else {
        // Increment global unread count
        setUnreadCount((prev) => prev + 1);
      }

      // Update conversations list with latest message
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === convId);
        if (index === -1) {
          refreshConversations();
          return prev;
        }
        const updated = [...prev];
        const conv = { ...updated[index] };
        conv.lastMessage = newMsg;
        conv.updatedAt = new Date().toISOString();
        if (!currentActive || currentActive._id !== convId) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
        updated.splice(index, 1);
        return [conv, ...updated];
      });
    });

    // Listen to typing status
    const offTyping = socketService.on('typing:status', ({ conversationId, userId, isTyping }) => {
      setTypingMap((prev) => {
        const next = { ...prev };
        if (!next[conversationId]) {
          next[conversationId] = new Set();
        } else {
          next[conversationId] = new Set(next[conversationId]);
        }

        if (isTyping) {
          next[conversationId].add(userId);
        } else {
          next[conversationId].delete(userId);
        }
        return next;
      });
    });

    // Listen to presence events
    const offUserOnline = socketService.on('user:online', ({ userId }) => {
      if (userId) setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    const offUserOffline = socketService.on('user:offline', ({ userId }) => {
      if (userId) {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    });

    const offPresenceSync = socketService.on('presence:sync', (userIds) => {
      if (Array.isArray(userIds)) {
        setOnlineUsers(new Set(userIds));
      }
    });

    // Cleanup listeners on unmount or user change
    return () => {
      offNewMessage?.();
      offTyping?.();
      offUserOnline?.();
      offUserOffline?.();
      offPresenceSync?.();
    };
  }, [isAuthenticated, user, refreshConversations]);

  // Initial load of conversations & unread count
  useEffect(() => {
    if (isAuthenticated) {
      refreshConversations();
      refreshUnreadCount();
    }
  }, [isAuthenticated, refreshConversations, refreshUnreadCount]);

  // Send a message
  const sendMessage = async (content, attachments = []) => {
    if (!activeConversation) return;
    const convId = activeConversation._id || activeConversation.id;

    // Emit typing false
    socketService.sendTyping(convId, false);

    const newMsg = await chatService.sendMessage(convId, content, attachments);

    // Optimistically update message feed
    setMessages((prev) => {
      if (prev.some((m) => m._id === newMsg._id)) return prev;
      return [...prev, newMsg];
    });

    // Update conversation list
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c._id === convId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        lastMessage: newMsg,
        updatedAt: new Date().toISOString(),
      };
      const [item] = updated.splice(idx, 1);
      return [item, ...updated];
    });

    return newMsg;
  };

  // Open or initiate chat with a user
  const openChatWithUser = async (targetUserId) => {
    try {
      const conv = await chatService.getOrCreateConversation(targetUserId);
      setActiveConversation(conv);
      await loadMessages(conv._id || conv.id);
      await refreshConversations();
      return conv;
    } catch (err) {
      throw err;
    }
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    if (conv) {
      loadMessages(conv._id || conv.id);
    } else {
      setMessages([]);
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const isConversationTyping = (convId) => {
    const typingSet = typingMap[convId];
    if (!typingSet) return false;
    // Exclude current user from typing indicator
    const others = [...typingSet].filter((id) => id !== user?._id && id !== user?.id);
    return others.length > 0;
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        unreadCount,
        onlineUsers,
        selectConversation,
        sendMessage,
        openChatWithUser,
        refreshConversations,
        refreshUnreadCount,
        loadMessages,
        isUserOnline,
        isConversationTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
