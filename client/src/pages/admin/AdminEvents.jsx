import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  Star,
  Clock,
  Video,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatters';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await adminService.getEvents(params);
      const list = Array.isArray(res) ? res : res.events || [];
      setEvents(list);
    } catch (err) {
      console.warn('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handleModerate = async (eventId, action, isFeatured = false) => {
    let note = '';
    if (action === 'reject' || action === 'cancel') {
      const promptRes = window.prompt(`Enter reason for ${action.toUpperCase()}:`, '');
      if (promptRes === null) return;
      note = promptRes;
    }

    setActionLoading(eventId);
    try {
      await adminService.moderateEvent(eventId, action, note, isFeatured);
      await fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to moderate event');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <Calendar className="w-4 h-4 text-amber-600" /> Events Moderation
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Summits, Demo Days & Webinars</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Approve ecosystem submissions, pin featured events, and monitor attendee RSVPs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by event title, host venture, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-auto"
        >
          <option value="all">All Moderation Statuses</option>
          <option value="pending">Pending Approval</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <span className="text-xs text-neutral-500">Querying events catalog...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 text-neutral-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No events matching filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Event Title</th>
                  <th className="py-4 px-6">Date & Format</th>
                  <th className="py-4 px-6">Status & Featured</th>
                  <th className="py-4 px-6">Attendees</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {events.map((ev) => {
                  const isPending = ev.status === 'pending';
                  const isPublished = ev.status === 'published';
                  const isFeatured = ev.isFeatured;

                  return (
                    <tr key={ev._id || ev.id} className="hover:bg-neutral-50/50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div>
                            <Link
                              to={`/events/${ev.slug || ev._id}`}
                              className="font-bold text-charcoal hover:text-amber-700 transition"
                            >
                              {ev.title}
                            </Link>
                            <span className="text-[11px] text-neutral-400 block mt-0.5">
                              {ev.organization?.name || 'Golden Circle Host'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-neutral-600">
                        <div>{ev.startDate ? formatDate(ev.startDate) : 'TBD'}</div>
                        <div className="text-[11px] text-neutral-400 capitalize">{ev.format || 'Virtual'}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPublished
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {ev.status || 'Published'}
                          </span>

                          {isFeatured && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-semibold text-charcoal">
                        {ev.attendeeCount || 0} RSVPs
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Featured */}
                          <button
                            disabled={actionLoading === ev._id}
                            onClick={() => handleModerate(ev._id, 'feature', !isFeatured)}
                            className={`p-1.5 rounded-lg transition ${
                              isFeatured ? 'text-amber-600 bg-amber-50' : 'text-neutral-400 hover:text-amber-600'
                            }`}
                            title={isFeatured ? 'Unpin featured summit' : 'Feature on summit banner'}
                          >
                            <Star className="w-4 h-4" />
                          </button>

                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                loading={actionLoading === ev._id}
                                onClick={() => handleModerate(ev._id, 'approve')}
                                className="text-xs px-2.5 py-1"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                loading={actionLoading === ev._id}
                                onClick={() => handleModerate(ev._id, 'reject')}
                                className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          <Link to={`/events/${ev.slug || ev._id}`}>
                            <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
