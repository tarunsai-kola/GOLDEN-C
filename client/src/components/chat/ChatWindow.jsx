import { useState, useEffect, useRef } from 'react';
import {
  Send,
  MoreVertical,
  Bell,
  BellOff,
  ShieldAlert,
  ShieldCheck,
  Check,
  CheckCheck,
  Flag,
  ArrowLeft,
  Building2,
  Smile,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chat.service';
import socketService from '../../services/socket.service';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import BlockedConversationNotice from './BlockedConversationNotice';
import ReportMessageModal from './ReportMessageModal';
import { generateInitials, formatDate } from '../../utils/helpers';

export default function ChatWindow({
  conversation,
  messages = [],
  loading = false,
  onSendMessage,
  onBack, // for mobile split-view navigation
  isOnline = false,
  isTyping = false,
  onConversationUpdated,
}) {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [blocking, setBlocking] = useState(false);
  const [muting, setMuting] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom on messages change
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [conversation?._id, conversation?.id]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-50/50 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <Smile className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-charcoal text-base">Select a Conversation</h3>
        <p className="text-xs text-neutral-500 max-w-sm mt-1">
          Choose a conversation from the left to start collaborating, pitching, or discussing startup ventures.
        </p>
      </div>
    );
  }

  // Determine recipient
  const getRecipient = () => {
    if (!conversation?.participants) return conversation?.recipient || {};
    return (
      conversation.participants.find(
        (p) => (p._id || p.id) !== (user?._id || user?.id)
      ) || conversation.participants[0] || {}
    );
  };

  const recipient = getRecipient();
  const initials = generateInitials(recipient?.fullName || 'User');
  const isBlocked = conversation.isBlocked;
  const isBlockedByMe = conversation.blockedBy === (user?._id || user?.id);

  // Handle typing input
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    const convId = conversation._id || conversation.id;

    socketService.sendTyping(convId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(convId, false);
    }, 2000);
  };

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending || isBlocked) return;

    setSending(true);
    try {
      await onSendMessage(inputText.trim());
      setInputText('');
      const convId = conversation._id || conversation.id;
      socketService.sendTyping(convId, false);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Toggle Mute
  const handleToggleMute = async () => {
    setMuting(true);
    try {
      const nextMuted = !conversation.isMuted;
      await chatService.toggleMute(conversation._id || conversation.id, nextMuted);
      onConversationUpdated?.({ ...conversation, isMuted: nextMuted });
    } catch (err) {
      alert(err.message || 'Failed to toggle mute');
    } finally {
      setMuting(false);
      setShowMenu(false);
    }
  };

  // Toggle Block
  const handleToggleBlock = async () => {
    const nextBlocked = !isBlocked;
    if (nextBlocked && !window.confirm(`Are you sure you want to block ${recipient.fullName || 'this member'}?`)) {
      return;
    }
    setBlocking(true);
    try {
      await chatService.toggleBlock(conversation._id || conversation.id, nextBlocked);
      onConversationUpdated?.({
        ...conversation,
        isBlocked: nextBlocked,
        blockedBy: nextBlocked ? (user?._id || user?.id) : null,
      });
    } catch (err) {
      alert(err.message || 'Failed to update block status');
    } finally {
      setBlocking(false);
      setShowMenu(false);
    }
  };

  // Report message
  const handleReportMessage = async ({ reason, details }) => {
    if (!reportingMessage) return;
    await chatService.reportMessage(reportingMessage._id || reportingMessage.id, reason, details);
    alert('Message reported to Golden Circle safety team. Thank you.');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/30 overflow-hidden relative">
      {/* Chat Window Top Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-neutral-200 flex items-center justify-between gap-4 z-10 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-2 rounded-xl text-neutral-500 hover:text-charcoal hover:bg-neutral-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {recipient?.avatar ? (
              <img
                src={recipient.avatar}
                alt={recipient.fullName}
                className="w-10 h-10 rounded-2xl object-cover border border-neutral-200"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-2xl border flex items-center justify-center font-bold text-xs"
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
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>

          {/* Name & Headline */}
          <div className="min-w-0">
            <h3 className="font-bold text-charcoal text-sm truncate flex items-center gap-2">
              <span>{recipient?.fullName || 'Ecosystem Member'}</span>
              {conversation.isMuted && <BellOff className="w-3.5 h-3.5 text-neutral-400" />}
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-500 truncate">
              {isOnline ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active now
                </span>
              ) : (
                <span>{recipient?.headline || recipient?.organization?.name || 'Golden Circle Member'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Options dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-neutral-500 hover:text-charcoal hover:bg-neutral-100 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-2xl shadow-xl py-1.5 z-50 text-xs">
              <button
                onClick={handleToggleMute}
                disabled={muting}
                className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
              >
                {conversation.isMuted ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-amber-600" /> Unmute Chat
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-neutral-400" /> Mute Notifications
                  </>
                )}
              </button>
              <button
                onClick={handleToggleBlock}
                disabled={blocking}
                className={`w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 ${
                  isBlocked ? 'text-neutral-700' : 'text-red-600'
                }`}
              >
                {isBlocked ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Unblock Member
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Block Member
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-neutral-400">
            <Spinner size="md" />
            <span className="text-xs">Loading secure message history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-neutral-400">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Smile className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-charcoal text-xs">Direct Connection Established</h4>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">
              Send your first message to introduce yourself, discuss deal terms, or explore syndicates.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = (msg.sender?._id || msg.sender) === (user?._id || user?.id);

            return (
              <div
                key={msg._id || msg.id || idx}
                className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* Reporting Action for recipient message */}
                {!isMe && (
                  <button
                    onClick={() => setReportingMessage(msg)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-red-500 transition-opacity"
                    title="Report message"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                )}

                <div
                  className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs relative ${
                    isMe
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-br-xs'
                      : 'bg-white border border-neutral-200/90 text-charcoal rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>

                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                      isMe ? 'text-amber-100/90' : 'text-neutral-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      <span>
                        {msg.isRead ? (
                          <CheckCheck className="w-3 h-3 text-white inline" />
                        ) : (
                          <Check className="w-3 h-3 text-amber-200 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time Typing Bubble */}
        {isTyping && (
          <div className="flex items-center gap-2 text-neutral-400 text-xs italic">
            <div className="bg-white border border-neutral-200 rounded-2xl px-3.5 py-2 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
              <span className="ml-1 text-[11px] text-neutral-500">{recipient.fullName || 'Member'} is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Blocked Conversation Notice Banner */}
      {isBlocked ? (
        <BlockedConversationNotice
          isBlockedByMe={isBlockedByMe}
          onUnblock={handleToggleBlock}
          loading={blocking}
        />
      ) : (
        /* Message Input Bar */
        <div className="p-4 bg-white border-t border-neutral-200">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center bg-neutral-50 border border-neutral-200 rounded-2xl focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white transition-all">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full pl-4 pr-10 py-3 bg-transparent text-xs text-charcoal focus:outline-none placeholder:text-neutral-400"
              />
            </div>

            <Button
              type="submit"
              size="md"
              disabled={!inputText.trim() || sending}
              loading={sending}
              className="!rounded-2xl !p-3 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Safety Report Modal */}
      <ReportMessageModal
        isOpen={Boolean(reportingMessage)}
        onClose={() => setReportingMessage(null)}
        onSubmit={handleReportMessage}
        messageContent={reportingMessage?.content}
      />
    </div>
  );
}
