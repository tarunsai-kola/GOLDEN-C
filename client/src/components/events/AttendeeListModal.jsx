import { X, Users, Building2, ShieldCheck } from 'lucide-react';
import { generateInitials } from '../../utils/helpers';

export default function AttendeeListModal({ isOpen, onClose, attendees = [], eventTitle }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Users className="text-amber-500" size={18} />
              Confirmed Attendees ({attendees.length})
            </h3>
            <p className="text-xs text-neutral-500 truncate max-w-xs">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {attendees.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-8">
              No public attendee details available.
            </p>
          ) : (
            attendees.map((att, idx) => {
              const u = att.user || att.userId || att;
              const initials = generateInitials(u.fullName || 'Attendee');

              return (
                <div
                  key={att._id || att.id || idx}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100"
                >
                  <div
                    className="h-10 w-10 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{
                      borderColor: '#C9A84C',
                      color: '#A07830',
                      backgroundColor: '#FFFDF5',
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-xs truncate">
                      {u.fullName || 'Ecosystem Pioneer'}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      {u.accountType === 'individual' ? 'Professional' : 'Founder'}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    RSVPed
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
