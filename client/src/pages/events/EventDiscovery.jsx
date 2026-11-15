import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  Search,
  PlusCircle,
  Crown,
  Video,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import eventService from '../../services/event.service';
import EventCard from '../../components/events/EventCard';
import EventFilterBar from '../../components/events/EventFilterBar';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function EventDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    format: searchParams.get('format') || '',
    pricingType: searchParams.get('pricingType') || '',
    officialOnly: searchParams.get('officialOnly') === 'true',
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRegistrationIds, setMyRegistrationIds] = useState([]);

  // Fetch registered events for logged-in user
  useEffect(() => {
    eventService.getMyRegistrations().then((regs) => {
      const ids = (Array.isArray(regs) ? regs : []).map((r) => r.eventId?._id || r.eventId || r._id);
      setMyRegistrationIds(ids);
    });
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: searchQuery.trim() || undefined,
        category: filters.category || undefined,
        format: filters.format || undefined,
        pricingType: filters.pricingType || undefined,
        officialOnly: filters.officialOnly ? true : undefined,
        timeline: activeTab,
      };

      const res = await eventService.getEvents(params);
      const list = res.data || (Array.isArray(res) ? res : []);
      setEvents(list);
    } catch (err) {
      console.warn('Failed to fetch events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, activeTab]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16">
      {/* ── Top Hero Banner ── */}
      <section className="bg-gradient-to-b from-[#1A1A2E] to-[#2D2D44] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <Crown size={13} className="fill-amber-300" /> Exclusive Startup Ecosystem Sessions
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Events, Masterclasses & Demo Days
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-300 mb-8">
            Learn from top founders, pitch to vetted venture funds, and connect with ambitious peers in live interactive rooms.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/events/new">
              <Button variant="primary" size="md" className="gap-2 shadow-lg">
                <PlusCircle size={16} /> Host an Event
              </Button>
            </Link>
            <Link to="/events/manage">
              <Button variant="secondary" size="md" className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
                Organizer Hub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Search & Filter Controls ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="space-y-4 mb-8">
          {/* Search bar + timeline tabs */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, speaker, topic, or keyword..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Upcoming vs Past Switcher */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-gray-900'
                }`}
              >
                Upcoming Events
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'past'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-gray-900'
                }`}
              >
                Past Sessions
              </button>
            </div>
          </div>

          {/* Filter Bar Component */}
          <EventFilterBar filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* ── Events Grid ── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-neutral-500">Loading ecosystem events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center max-w-lg mx-auto shadow-xs my-8">
            <Calendar className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {activeTab === 'upcoming' ? 'No Upcoming Events Found' : 'No Past Events Found'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
              {searchQuery || filters.category || filters.format
                ? 'Try adjusting your search criteria or clear your active filters.'
                : 'Be the first leader or startup to host an ecosystem session!'}
            </p>
            <Link to="/events/new">
              <Button variant="primary" size="sm" className="gap-1.5 text-xs mx-auto">
                <PlusCircle size={14} /> Submit an Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const evId = ev._id || ev.id;
              const isRegistered = myRegistrationIds.includes(evId);

              return (
                <EventCard
                  key={evId}
                  event={ev}
                  isRegistered={isRegistered}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
