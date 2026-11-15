import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Globe,
  Users,
  Crown,
  Building2,
  ArrowRight,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatters';

export default function EventCard({
  event,
  isRegistered = false,
  onRegister,
  onCancelRegistration,
}) {
  const eventId = event._id || event.id;
  const isOfficial = event.isOfficial || event.organizerType === 'Platform';
  const organizerName = event.organization?.name || event.organizerName || 'The Golden Circle';
  const dateFormatted = event.date ? formatDate(event.date) : 'Upcoming';
  const timeFormatted = event.startTime ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}` : '';

  const formatIcon = {
    Online: <Video size={12} className="text-blue-500" />,
    Offline: <MapPin size={12} className="text-red-500" />,
    Hybrid: <Globe size={12} className="text-purple-500" />,
  }[event.format] || <Video size={12} className="text-blue-500" />;

  const speakers = event.speakers || [];
  const attendeesCount = event.attendeeCount || (event.attendees ? event.attendees.length : 0);

  return (
    <div className="group rounded-3xl border border-neutral-200/90 bg-white shadow-xs hover:shadow-lg hover:-translate-y-1 transition duration-200 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Cover Thumbnail */}
        <div className="relative h-40 w-full overflow-hidden bg-neutral-900">
          {event.thumbnail ? (
            <img
              src={event.thumbnail}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: isOfficial
                  ? 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 50%, #C9A84C 100%)'
                  : 'linear-gradient(135deg, #2D2D44 0%, #1A1A2E 100%)',
              }}
            />
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isOfficial ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-sm border border-amber-400">
                  <Crown size={11} className="fill-white" /> Official
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-neutral-800 backdrop-blur-xs shadow-2xs">
                  <Building2 size={11} className="text-amber-600" /> {organizerName}
                </span>
              )}
              {event.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs">
                  {event.category}
                </span>
              )}
            </div>

            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs ${
              event.pricingType === 'Paid'
                ? 'bg-neutral-900 text-amber-300'
                : 'bg-green-600 text-white'
            }`}>
              {event.pricingType === 'Paid' ? 'Paid' : 'Free RSVP'}
            </span>
          </div>

          {/* Bottom Banner Pill (Format & Location) */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-medium">
              {formatIcon}
              <span>{event.format || 'Online'}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs">
              <Users size={11} /> {attendeesCount} RSVPed
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Date & Time Row */}
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-2">
            <Calendar size={13} className="text-amber-600" />
            <span>{dateFormatted}</span>
            {timeFormatted && (
              <>
                <span className="text-neutral-300">•</span>
                <Clock size={12} className="text-neutral-400" />
                <span className="text-neutral-500 font-normal">{timeFormatted}</span>
              </>
            )}
          </div>

          {/* Title */}
          <Link to={`/events/${event.slug || eventId}`}>
            <h3 className="font-bold text-gray-900 text-base group-hover:text-amber-700 transition line-clamp-2 mb-2 leading-snug">
              {event.title}
            </h3>
          </Link>

          {/* Short summary */}
          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">
            {event.summary || event.description || 'Exclusive ecosystem session hosted on The Golden Circle platform.'}
          </p>

          {/* Speakers Row */}
          {speakers.length > 0 && (
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400 font-medium">Speaker:</span>
                <span className="font-semibold text-gray-800 text-[11px] truncate max-w-[150px]">
                  {speakers[0].name}
                  {speakers[0].title && `, ${speakers[0].title}`}
                </span>
              </div>
              {speakers.length > 1 && (
                <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                  +{speakers.length - 1} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-5 py-3.5 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between">
        <Link
          to={`/events/${event.slug || eventId}`}
          className="text-xs font-semibold text-neutral-600 hover:text-gray-900"
        >
          View Agenda
        </Link>

        {isRegistered ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            <CheckCircle2 size={13} className="text-green-600" /> Confirmed RSVP
          </span>
        ) : (
          <Link to={`/events/${event.slug || eventId}`}>
            <Button variant="primary" size="sm" className="text-xs py-1.5 px-3.5 gap-1 shadow-xs">
              RSVP Now <ArrowRight size={12} />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
