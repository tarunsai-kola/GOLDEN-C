import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowLeft,
  Crown,
  Eye,
  ExternalLink,
  ShieldCheck,
  Building2,
  Check,
  X,
} from 'lucide-react';
import eventService from '../../services/event.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import AttendeeListModal from '../../components/events/AttendeeListModal';
import { formatDate } from '../../utils/formatters';

export default function EventManagementDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [events, setEvents] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'moderation'

  // Selected event for attendee modal
  const [selectedEventAttendees, setSelectedEventAttendees] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [evRes, modRes] = await Promise.allSettled([
        eventService.getEvents({ limit: 50 }),
        eventService.getModerationQueue(),
      ]);

      if (evRes.status === 'fulfilled') {
        const list = evRes.value.data || (Array.isArray(evRes.value) ? evRes.value : []);
        setEvents(list);
      }

      if (modRes.status === 'fulfilled') {
        setModerationQueue(Array.isArray(modRes.value) ? modRes.value : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, status, reason = '') => {
    try {
      await eventService.updateStatus(id, status, reason);
      await loadData();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleOpenAttendees = async (ev) => {
    try {
      const res = await eventService.getAttendees(ev._id || ev.id);
      const list = Array.isArray(res) ? res : res.attendees || [];
      setSelectedEventAttendees(list);
      setSelectedEventTitle(ev.title);
    } catch (err) {
      alert('Could not fetch attendees list');
    }
  };

  const totalAttendees = events.reduce((acc, curr) => acc + (curr.attendeeCount || 0), 0);

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading organizer hub...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-amber-600 mb-2 transition"
          >
            <ArrowLeft size={13} /> Back to Events
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Event Management Hub
            </h1>
            {isAdmin && <Badge variant="gold">Platform Admin</Badge>}
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track session attendance, verify speaker schedules, and review community event submissions.
          </p>
        </div>

        <Link to="/events/new">
          <Button variant="primary" size="md" className="gap-2">
            <PlusCircle size={16} /> Host New Event
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Active Sessions
          </span>
          <div className="text-2xl font-bold text-gray-900">{events.length}</div>
          <span className="text-xs text-neutral-400">Total events listed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Total Confirmed RSVPs
          </span>
          <div className="text-2xl font-bold text-amber-600">{totalAttendees}</div>
          <span className="text-xs text-neutral-400">Ecosystem attendees</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Moderation Queue
          </span>
          <div className="text-2xl font-bold text-neutral-900">{moderationQueue.length}</div>
          <span className="text-xs text-neutral-400">Pending review</span>
        </div>
      </div>

      {/* Admin Moderation Tabs (if Admin) */}
      {isAdmin && moderationQueue.length > 0 && (
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-500 text-white'
                : 'bg-white border text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'moderation'
                ? 'bg-amber-500 text-white'
                : 'bg-white border text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Review Queue ({moderationQueue.length})
          </button>
        </div>
      )}

      {/* Moderation Queue View */}
      {activeTab === 'moderation' && isAdmin ? (
        <Card padding="none" className="overflow-hidden border-neutral-200 mb-8">
          <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
            <h3 className="font-bold text-amber-900 text-sm">Events Awaiting Approval</h3>
            <span className="text-xs text-amber-800 font-medium">{moderationQueue.length} Pending</span>
          </div>
          <div className="divide-y divide-neutral-200">
            {moderationQueue.map((item) => (
              <div key={item._id || item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">{item.title}</span>
                    <Badge variant="warning">Pending Review</Badge>
                  </div>
                  <p className="text-xs text-neutral-500">{item.summary}</p>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Date: {formatDate(item.date)} • Category: {item.category} • Format: {item.format}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus(item._id || item.id, 'Published')}
                    className="gap-1 text-xs"
                  >
                    <Check size={14} /> Approve & Publish
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const reason = window.prompt('Rejection reason:');
                      if (reason) handleUpdateStatus(item._id || item.id, 'Rejected', reason);
                    }}
                    className="gap-1 text-xs"
                  >
                    <X size={14} /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* All Events Table */
        <Card padding="none" className="overflow-hidden border-neutral-200">
          <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base">Ecosystem Events Directory</h3>
            <span className="text-xs text-neutral-500">{events.length} Active Listings</span>
          </div>

          <div className="divide-y divide-neutral-200 overflow-x-auto">
            {events.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No events currently managed. Create a new event using the button above.
              </div>
            ) : (
              events.map((ev) => {
                const evId = ev._id || ev.id;
                const status = ev.status || 'Published';

                return (
                  <div
                    key={evId}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/events/${ev.slug || evId}`}
                          className="font-bold text-gray-900 text-sm hover:text-amber-700"
                        >
                          {ev.title}
                        </Link>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          status === 'Published'
                            ? 'bg-green-100 text-green-800'
                            : status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                        <span>{formatDate(ev.date)}</span>
                        <span>•</span>
                        <span className="capitalize">{ev.format}</span>
                        <span>•</span>
                        <span className="text-amber-700 font-semibold">{ev.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenAttendees(ev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                      >
                        <Users size={13} className="text-amber-600" />
                        <span>{ev.attendeeCount || 0} RSVPs</span>
                      </button>

                      <Link to={`/events/${ev.slug || evId}`}>
                        <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                          <Eye size={14} /> Preview
                        </Button>
                      </Link>

                      {status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            if (window.confirm('Cancel this event?')) {
                              handleUpdateStatus(evId, 'Cancelled');
                            }
                          }}
                          className="text-xs text-neutral-400 hover:text-red-600 p-1.5 transition cursor-pointer"
                          title="Cancel Event"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Attendee Roster Modal */}
      <AttendeeListModal
        isOpen={Boolean(selectedEventAttendees)}
        onClose={() => setSelectedEventAttendees(null)}
        attendees={selectedEventAttendees || []}
        eventTitle={selectedEventTitle}
      />
    </div>
  );
}
