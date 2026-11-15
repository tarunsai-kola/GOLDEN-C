import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  Video,
  MapPin,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatters';

export default function UpcomingRegistrationsList({
  registrations = [],
}) {
  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              My Registered Events & Tickets ({registrations.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Access virtual livestream links and verified entry passes for ecosystem masterclasses.
            </p>
          </div>
        </div>

        <Link
          to="/events"
          className="text-xs font-semibold text-amber-700 hover:text-amber-800"
        >
          Explore More Events
        </Link>
      </div>

      {registrations.length === 0 ? (
        <div className="p-8 rounded-2xl bg-neutral-50 text-center border border-neutral-200/80">
          <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-neutral-500 mb-3">You have no upcoming event tickets.</p>
          <Link to="/events">
            <Button variant="secondary" size="sm" className="text-xs">
              Browse Events Calendar
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {registrations.map((item) => {
            const ev = item.event || item;
            const evId = ev._id || ev.id;
            const isVirtual = ev.format === 'Virtual' || ev.isVirtual;

            return (
              <div
                key={evId}
                className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-amber-300 transition flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {ev.eventType || 'Event'}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {ev.startDate ? formatDate(ev.startDate) : 'Upcoming'}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {ev.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                    {ev.organization?.name || 'Hosted by Ecosystem Partners'}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    {isVirtual ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-blue-500" /> Virtual Stream
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-amber-600" /> In-person
                      </>
                    )}
                  </span>

                  <Link to={`/events/${ev.slug || evId}`}>
                    <Button variant="primary" size="sm" className="text-xs px-2.5 py-1">
                      View Ticket
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
