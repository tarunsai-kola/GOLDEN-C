import { ShieldAlert, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

export default function BlockedConversationNotice({
  isBlockedByMe,
  onUnblock,
  loading = false,
}) {
  return (
    <div className="p-6 bg-red-50/50 border-t border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-100 rounded-2xl text-red-600 flex-shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-red-900">
            {isBlockedByMe
              ? 'You have blocked this conversation'
              : 'This conversation has been restricted'}
          </h4>
          <p className="text-[11px] text-red-700/80 mt-0.5">
            {isBlockedByMe
              ? 'Neither of you can send messages until you unblock this member.'
              : 'Direct messaging with this user is currently disabled.'}
          </p>
        </div>
      </div>

      {isBlockedByMe && onUnblock && (
        <Button
          size="sm"
          variant="secondary"
          loading={loading}
          onClick={onUnblock}
          className="text-xs gap-1.5 border-red-200 text-red-700 hover:bg-red-100/50"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Unblock Member
        </Button>
      )}
    </div>
  );
}
