import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Globe,
  Users,
  Crown,
  Building2,
  CheckCircle2,
  AlertCircle,
  Share2,
  ExternalLink,
  ArrowLeft,
  CalendarPlus,
  Star,
  Lock,
  Sparkles,
} from 'lucide-react';
import eventService from '../../services/event.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import AttendeeListModal from '../../components/events/AttendeeListModal';
import EventFeedbackModal from '../../components/events/EventFeedbackModal';
import { formatDate } from '../../utils/formatters';
import { generateInitials } from '../../utils/helpers';

export default function EventDetails() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // RSVP state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [attendees, setAttendees] = useState([]);

  // Modals state
  const [attendeeModalOpen, setAttendeeModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await eventService.getEventBySlugOrId(slugOrId);
        const data = res.event || res;
        setEvent(data);

        if (res.isRegistered !== undefined) {
          setIsRegistered(res.isRegistered);
        }

        // Fetch attendees
        try {
          const attRes = await eventService.getAttendees(data._id || data.id);
          const attList = Array.isArray(attRes) ? attRes : attRes.attendees || [];
          setAttendees(attList);

          // Check if current user is registered
          if (user) {
            const hasRegistered = attList.some(
              (a) => (a.user?._id || a.userId || a.user?.id) === (user._id || user.id)
            );
            if (hasRegistered) setIsRegistered(true);
          }
        } catch {
          setAttendees([]);
        }
      } catch (err) {
        setError(err.message || 'Event not found');
      } finally {
        setLoading(false);
      }
    };

    if (slugOrId) fetchEvent();
  }, [slugOrId, user]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${slugOrId}` } } });
      return;
    }

    setRegistering(true);
    try {
      await eventService.registerForEvent(event._id || event.id);
      setIsRegistered(true);
      setEvent((prev) => ({
        ...prev,
        attendeeCount: (prev.attendeeCount || 0) + 1,
      }));
    } catch (err) {
      alert(err.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Cancel your RSVP for this event?')) return;
    setRegistering(true);
    try {
      await eventService.cancelRegistration(event._id || event.id);
      setIsRegistered(false);
      setEvent((prev) => ({
        ...prev,
        attendeeCount: Math.max(0, (prev.attendeeCount || 1) - 1),
      }));
    } catch (err) {
      alert(err.message || 'Failed to cancel registration');
    } finally {
      setRegistering(false);
    }
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!event) return '#';
    const title = encodeURIComponent(event.title || 'Golden Circle Event');
    const details = encodeURIComponent(event.summary || event.description || '');
    const location = encodeURIComponent(event.venue || event.meetingUrl || 'Online');

    // Basic date parsing
    const dateObj = new Date(event.date || Date.now());
    const dateStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateStr}/${dateStr}`;
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading session details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
        <p className="text-neutral-600 mb-6">{error || 'This event does not exist.'}</p>
        <Link to="/events">
          <Button variant="primary" size="md">
            Return to All Events
          </Button>
        </Link>
      </div>
    );
  }

  const isOfficial = event.isOfficial || event.organizerType === 'Platform';
  const organizerName = event.organization?.name || event.organizerName || 'The Golden Circle';
  const dateFormatted = event.date ? formatDate(event.date) : 'Upcoming';
  const speakers = event.speakers || [];
  const attendeesCount = event.attendeeCount || attendees.length;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16">
      {/* ── Top Cover Banner ── */}
      <div className="relative w-full h-72 sm:h-96 bg-neutral-900 overflow-hidden">
        {event.thumbnail ? (
          <img
            src={event.thumbnail}
            alt={event.title}
            className="w-full h-full object-cover opacity-85"
          />
        ) : (
          <div
            className="w-full h-full opacity-90"
            style={{
              background: isOfficial
                ? 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 60%, #C9A84C 100%)'
                : 'linear-gradient(135deg, #2D2D44 0%, #1A1A2E 100%)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute top-6 left-6 z-10">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white text-xs font-semibold backdrop-blur-xs transition"
          >
            <ArrowLeft size={14} /> Back to Events
          </Link>
        </div>
      </div>

      {/* ── Main Details Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Event Content & Agenda */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 shadow-sm">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {isOfficial ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500 text-white shadow-2xs border border-amber-400">
                    <Crown size={13} className="fill-white" /> Golden Circle Masterclass
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                    <Building2 size={13} className="text-amber-600" /> {organizerName}
                  </span>
                )}
                <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
                  {event.category || 'Session'}
                </span>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  {event.pricingType === 'Paid' ? 'Paid Pass' : 'Complimentary RSVP'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                {event.title}
              </h1>

              {/* Short summary */}
              {event.summary && (
                <p className="text-base text-neutral-600 font-medium leading-relaxed mb-6">
                  {event.summary}
                </p>
              )}

              {/* Schedule row */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-xs">
                <div className="flex items-center gap-2.5">
                  <Calendar className="text-amber-600 h-4 w-4 flex-shrink-0" />
                  <div>
                    <span className="text-neutral-400 block font-medium">Date</span>
                    <span className="font-bold text-gray-900">{dateFormatted}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="text-amber-600 h-4 w-4 flex-shrink-0" />
                  <div>
                    <span className="text-neutral-400 block font-medium">Time</span>
                    <span className="font-bold text-gray-900">
                      {event.startTime || 'TBD'}
                      {event.endTime && ` - ${event.endTime}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {event.format === 'Offline' ? (
                    <MapPin className="text-red-500 h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Video className="text-blue-500 h-4 w-4 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-neutral-400 block font-medium">Format</span>
                    <span className="font-bold text-gray-900">{event.format || 'Online Room'}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Description / Overview */}
              <div className="prose prose-neutral max-w-none text-neutral-700 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-8">
                {event.description}
              </div>

              {/* Key Takeaways / Agenda */}
              {event.agenda && event.agenda.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Session Agenda</h3>
                  <div className="space-y-3">
                    {event.agenda.map((ag, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white border border-neutral-200 flex items-start gap-3"
                      >
                        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {ag.time || `Phase ${idx + 1}`}
                        </span>
                        <div>
                          <div className="font-bold text-gray-900 text-xs sm:text-sm">{ag.topic}</div>
                          {ag.details && <p className="text-xs text-neutral-500 mt-0.5">{ag.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speakers Section */}
              {speakers.length > 0 && (
                <div className="pt-6 border-t border-neutral-100">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={18} />
                    Featured Speakers & Mentors
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {speakers.map((sp, idx) => {
                      const spInitials = generateInitials(sp.name);
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3.5"
                        >
                          {sp.photo ? (
                            <img
                              src={sp.photo}
                              alt={sp.name}
                              className="h-12 w-12 rounded-xl object-cover border"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-xl border flex items-center justify-center font-bold text-xs"
                              style={{
                                borderColor: '#C9A84C',
                                color: '#A07830',
                                backgroundColor: '#FFFDF5',
                              }}
                            >
                              {spInitials}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{sp.name}</h4>
                            <p className="text-xs text-neutral-500">
                              {sp.title} {sp.company && `at ${sp.company}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: RSVP Box, Access & Venue */}
          <div className="space-y-6">
            {/* Primary RSVP Card */}
            <Card padding="lg" className="border-amber-200/90 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Registration Status
                </span>
                <span className="text-xs font-semibold text-neutral-600 flex items-center gap-1">
                  <Users size={12} className="text-amber-600" />
                  {attendeesCount} RSVPed
                </span>
              </div>

              {isRegistered ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-center">
                    <CheckCircle2 size={32} className="text-green-600 mx-auto mb-2" />
                    <h4 className="font-bold text-gray-900 text-sm">You are Registered!</h4>
                    <p className="text-xs text-neutral-600 mt-1">
                      Your seat is confirmed. Check your email for login and calendar details.
                    </p>
                  </div>

                  {/* Secret Meeting Link / Access */}
                  {event.meetingUrl && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-xs font-bold text-amber-900 block mb-1">
                        Live Room Access Link
                      </span>
                      <a
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1 break-all"
                      >
                        {event.meetingUrl} <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      <CalendarPlus size={14} className="text-amber-600" /> Add to Google Calendar
                    </a>

                    <button
                      onClick={handleCancelRegistration}
                      disabled={registering}
                      className="text-xs text-red-600 hover:text-red-700 text-center font-medium py-1 transition cursor-pointer"
                    >
                      Cancel My RSVP
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {event.pricingType === 'Paid' ? 'Paid Session' : 'Free Registration'}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {event.capacity
                        ? `Limited to ${event.capacity} total attendees.`
                        : 'Open to all registered Golden Circle members.'}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    loading={registering}
                    onClick={handleRegister}
                    className="w-full justify-center text-sm py-3 shadow-md"
                  >
                    Confirm My RSVP Now
                  </Button>

                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    <CalendarPlus size={14} className="text-amber-600" /> Save Date
                  </a>
                </div>
              )}
            </Card>

            {/* Venue & Location Details */}
            <Card padding="lg">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Location & Access</h3>
              <div className="space-y-3 text-xs">
                {event.format === 'Offline' || event.format === 'Hybrid' ? (
                  <div className="flex items-start gap-2.5 text-neutral-700">
                    <MapPin size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-gray-900">Physical Venue</span>
                      <span>{event.venue || 'Bangalore Startup Innovation Centre, India'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-neutral-700">
                    <Video size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-gray-900">Virtual Conference Room</span>
                      <span>Link unlocked upon confirmed RSVP.</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Attendees & Community Roster */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm">Network with Attendees</h3>
                <span className="text-xs font-bold text-amber-700">{attendees.length}</span>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                Connect with fellow founders, engineers, and investors attending this session.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAttendeeModalOpen(true)}
                className="w-full justify-center gap-1.5 text-xs"
              >
                <Users size={14} /> View Attendee List
              </Button>
            </Card>

            {/* Post-Event Feedback Button */}
            <div className="text-center">
              <button
                onClick={() => setFeedbackModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
              >
                <Star size={13} className="fill-amber-500 text-amber-500" /> Leave Session Feedback
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AttendeeListModal
        isOpen={attendeeModalOpen}
        onClose={() => setAttendeeModalOpen(false)}
        attendees={attendees}
        eventTitle={event.title}
      />

      <EventFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        eventId={event._id || event.id}
        eventTitle={event.title}
        onSubmitFeedback={(eId, payload) => eventService.submitFeedback(eId, payload)}
      />
    </div>
  );
}
