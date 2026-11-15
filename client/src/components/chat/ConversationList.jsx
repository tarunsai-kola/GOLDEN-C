import { useState } from 'react';
import {
  Search,
  BellOff,
  ShieldAlert,
  Check,
  CheckCheck,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateInitials, formatRelativeTime } from '../../utils/helpers';

export default function ConversationList({
  conversations = [],
  activeConversation,
  onSelectConversation,
  onlineUsers = new Set(),
  isConversationTyping = () => false,
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  // Extract other participant for 1-on-1 chats
  const getRecipient = (conv) => {
    if (!conv?.participants) return conv?.recipient || {};
    return conv.participants.find((p) => (p._id || p.id) !== (user?._id || user?.id)) || conv.participants[0] || {};
  };

  const filteredConversations = conversations.filter((c) => {
    const recipient = getRecipient(c);
    const nameMatch = recipient?.fullName?.toLowerCase().includes(search.toLowerCase());
    const snippetMatch = c.lastMessage?.content?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || snippetMatch;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Search Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-neutral-400" />
            <p className="text-xs">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const recipient = getRecipient(conv);
            const recipientId = recipient?._id || recipient?.id;
            const isOnline = onlineUsers.has(recipientId);
            const isSelected = (activeConversation?._id || activeConversation?.id) === (conv._id || conv.id);
            const unread = conv.unreadCount || 0;
            const isTyping = isConversationTyping(conv._id || conv.id);
            const initials = generateInitials(recipient?.fullName || 'User');
            const isLastMessageFromMe =
              (conv.lastMessage?.sender?._id || conv.lastMessage?.sender) === (user?._id || user?.id);

            return (
              <button
                key={conv._id || conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full text-left p-4 flex items-start gap-3.5 transition-colors relative ${
                  isSelected
                    ? 'bg-amber-50/50 border-r-2 border-amber-600'
                    : 'hover:bg-neutral-50/80'
                }`}
              >
                {/* Avatar with Online Status */}
                <div className="relative flex-shrink-0">
                  {recipient?.avatar ? (
                    <img
                      src={recipient.avatar}
                      alt={recipient.fullName}
                      className="w-11 h-11 rounded-2xl object-cover border border-neutral-200 shadow-xs"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-xs shadow-xs"
                      style={{
                        borderColor: '#C9A84C',
                        color: '#A07830',
                        backgroundColor: '#FFFDF5',
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  {isOnline && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                      title="Online now"
                    />
                  )}
                </div>

                {/* Content details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-charcoal' : 'text-neutral-800'
                      }`}
                    >
                      {recipient?.fullName || 'Ecosystem Peer'}
                    </h4>
                    {conv.lastMessage?.createdAt && (
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap flex-shrink-0">
                        {formatRelativeTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Headline snippet or last message */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-500 truncate flex items-center gap-1">
                      {isTyping ? (
                        <span className="text-amber-600 font-medium italic animate-pulse">
                          Typing...
                        </span>
                      ) : (
                        <>
                          {isLastMessageFromMe && (
                            <span className="text-neutral-400 flex-shrink-0">
                              {conv.lastMessage?.isRead ? (
                                <CheckCheck className="w-3 h-3 text-amber-600" />
                              ) : (
                                <Check className="w-3 h-3 text-neutral-400" />
                              )}
                            </span>
                          )}
                          <span className="truncate">
                            {conv.lastMessage?.content ||
                              (conv.isBlocked ? 'Conversation blocked' : 'Conversation started')}
                          </span>
                        </>
                      )}
                    </p>

                    {/* Unread badge & muted indicator */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {conv.isMuted && <BellOff className="w-3 h-3 text-neutral-400" />}
                      {conv.isBlocked && <ShieldAlert className="w-3 h-3 text-red-500" />}
                      {unread > 0 && (
                        <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
