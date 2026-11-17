import { useState } from 'react';
import {
  User,
  Building2,
  MapPin,
  MessageSquare,
  UserCheck,
  UserPlus,
  UserX,
  X,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { generateInitials } from '../../utils/helpers';

export default function ConnectionCard({
  user,
  type = 'connected', // 'connected' | 'received' | 'sent' | 'discover'
  connectionId,
  note = '',
  onAccept,
  onReject,
  onCancel,
  onRemove,
  onConnect,
  onMessage,
}) {
  const [loading, setLoading] = useState(false);
  const initials = generateInitials(user?.fullName || 'User');

  const handleAction = async (fn, ...args) => {
    if (!fn) return;
    setLoading(true);
    try {
      await fn(...args);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card hover padding="md" className="flex flex-col justify-between border-neutral-200/90 relative group">
      <div>
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 shadow-sm"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-sm shadow-sm"
                style={{
                  borderColor: '#C9A84C',
                  color: '#A07830',
                  backgroundColor: '#FFFDF5',
                }}
              >
                {initials}
              </div>
            )}
            {user?.role === 'admin' && (
              <span
                className="absolute -top-1 -right-1 p-0.5 bg-amber-500 rounded-full text-[10px] text-white"
                title="Platform Admin"
              >
                <Sparkles className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-charcoal text-sm truncate group-hover:text-amber-700 transition-colors">
              {user?.fullName || 'Ecosystem Member'}
            </h4>
            <p className="text-xs text-neutral-500 truncate mt-0.5">
              {user?.headline || user?.title || user?.bio || 'Founder / Builder'}
            </p>
            {user?.organization?.name && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="truncate">{user.organization.name}</span>
              </div>
            )}

            {/* Badges for What you cover / Time you have / Looking for */}
            {(user?.lookingFor || user?.timeCommitment || (user?.workCovers && user.workCovers.length > 0)) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.lookingFor && (
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full">
                    {user.lookingFor}
                  </span>
                )}
                {user.timeCommitment && (
                  <span className="text-[10px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                    {user.timeCommitment}
                  </span>
                )}
                {user.workCovers?.slice(0, 2).map((w) => (
                  <span key={w} className="text-[10px] bg-neutral-50 text-neutral-600 border border-neutral-200 px-1.5 py-0.5 rounded-md">
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location or Bio note */}
        {user?.location && (
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-3 pt-2.5 border-t border-neutral-100">
            <MapPin className="w-3 h-3 text-neutral-400" />
            <span className="truncate">{user.location}</span>
          </div>
        )}

        {/* Personalized Invitation Note if available */}
        {note && (
          <div className="mt-2.5 p-2 rounded-xl bg-amber-50/50 border border-amber-100 text-xs text-amber-900 italic line-clamp-2">
            "{note}"
          </div>
        )}
      </div>

      {/* Action Buttons based on type */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-2">
        {type === 'connected' && (
          <>
            <Button
              size="sm"
              variant="primary"
              className="flex-1 text-xs gap-1.5 py-1.5"
              onClick={() => onMessage?.(user?._id || user?.id)}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Message
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={loading}
              className="text-neutral-400 hover:text-red-600 hover:bg-red-50 text-xs px-2.5 py-1.5"
              title="Remove connection"
              onClick={() => handleAction(onRemove, user?._id || user?.id)}
            >
              <UserX className="w-4 h-4" />
            </Button>
          </>
        )}

        {type === 'received' && (
          <>
            <Button
              size="sm"
              variant="primary"
              loading={loading}
              className="flex-1 text-xs gap-1 py-1.5"
              onClick={() => handleAction(onAccept, connectionId)}
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={loading}
              className="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 text-xs gap-1 py-1.5"
              onClick={() => handleAction(onReject, connectionId)}
            >
              <X className="w-3.5 h-3.5" />
              Decline
            </Button>
          </>
        )}

        {type === 'sent' && (
          <div className="w-full flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Invitation Pending
            </span>
            <button
              disabled={loading}
              onClick={() => handleAction(onCancel, connectionId)}
              className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {type === 'discover' && (
          <Button
            size="sm"
            variant="secondary"
            loading={loading}
            className="w-full text-xs gap-1.5 py-1.5"
            onClick={() => handleAction(onConnect, user?._id || user?.id)}
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-600" />
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
}
