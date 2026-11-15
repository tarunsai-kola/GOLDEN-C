import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, ShieldAlert } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import Spinner from '../../components/ui/Spinner';

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const {
    conversations,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,
    selectConversation,
    sendMessage,
    onlineUsers,
    isConversationTyping,
    refreshConversations,
  } = useChat();

  // Mobile view state: 'list' or 'chat'
  const [mobileView, setMobileView] = useState(conversationId ? 'chat' : 'list');

  // Handle URL param selection
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const match = conversations.find(
        (c) => (c._id || c.id) === conversationId
      );
      if (match) {
        selectConversation(match);
        setMobileView('chat');
      }
    } else if (!conversationId && conversations.length > 0 && !activeConversation) {
      // Default select first conversation on desktop
      if (window.innerWidth >= 768) {
        selectConversation(conversations[0]);
      }
    }
  }, [conversationId, conversations]);

  const handleSelectConversation = (conv) => {
    selectConversation(conv);
    navigate(`/messages/${conv._id || conv.id}`, { replace: true });
    setMobileView('chat');
  };

  const handleBackToMobileList = () => {
    setMobileView('list');
    selectConversation(null);
    navigate('/messages', { replace: true });
  };

  // Check if current active user is online
  const getActiveRecipient = () => {
    if (!activeConversation?.participants) return activeConversation?.recipient || {};
    return activeConversation.participants[0] || {};
  };

  const recipient = getActiveRecipient();
  const isRecipientOnline = onlineUsers.has(recipient._id || recipient.id);
  const isTyping = activeConversation
    ? isConversationTyping(activeConversation._id || activeConversation.id)
    : false;

  return (
    <div className="h-[calc(100vh-4rem)] bg-white flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden border-t border-neutral-200">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full border-r border-neutral-200 flex flex-col ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {loadingConversations ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Spinner size="md" />
              <span className="text-xs text-neutral-400">Loading chats...</span>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
              onlineUsers={onlineUsers}
              isConversationTyping={isConversationTyping}
            />
          )}
        </div>

        {/* Right Area: Active Chat Window */}
        <div
          className={`flex-1 h-full flex flex-col ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            loading={loadingMessages}
            onSendMessage={sendMessage}
            onBack={handleBackToMobileList}
            isOnline={isRecipientOnline}
            isTyping={isTyping}
            onConversationUpdated={refreshConversations}
          />
        </div>
      </div>
    </div>
  );
}
