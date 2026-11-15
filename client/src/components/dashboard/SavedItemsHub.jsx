import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Building2,
  Briefcase,
  Calendar,
  Trash2,
  ExternalLink,
  MapPin,
  Compass,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { generateInitials, formatDate } from '../../utils/helpers';

export default function SavedItemsHub({
  savedStartups = [],
  savedJobs = [],
  savedEvents = [],
  onUnsaveStartup,
  onUnsaveJob,
  onUnsaveEvent,
}) {
  const [activeSubTab, setActiveSubTab] = useState('startups'); // 'startups' | 'jobs' | 'events'

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
      {/* Header and Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Saved Items & Watchlist
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Curate your portfolio of interesting ventures, career roles, and upcoming masterclasses.
            </p>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('startups')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'startups'
                ? 'bg-white text-charcoal shadow-xs'
                : 'text-neutral-500 hover:text-charcoal'
            }`}
          >
            Startups ({savedStartups.length})
          </button>
          <button
            onClick={() => setActiveSubTab('jobs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'jobs'
                ? 'bg-white text-charcoal shadow-xs'
                : 'text-neutral-500 hover:text-charcoal'
            }`}
          >
            Jobs ({savedJobs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'events'
                ? 'bg-white text-charcoal shadow-xs'
                : 'text-neutral-500 hover:text-charcoal'
            }`}
          >
            Events ({savedEvents.length})
          </button>
        </div>
      </div>

      {/* Startups Sub Tab */}
      {activeSubTab === 'startups' && (
        <div>
          {savedStartups.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-50 text-center border border-neutral-200/80">
              <Building2 className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-neutral-500 mb-3">No saved startups in your watchlist.</p>
              <Link to="/discover">
                <Button variant="secondary" size="sm" className="text-xs">
                  Browse Startups
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedStartups.map((item) => {
                const org = item.organization || item;
                const orgId = org._id || org.id;
                const initials = generateInitials(org.name || 'Startup');

                return (
                  <div
                    key={orgId}
                    className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-amber-300 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-xl border flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{
                          borderColor: '#C9A84C',
                          color: '#A07830',
                          backgroundColor: '#FFFDF5',
                        }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">
                          {org.name}
                        </h4>
                        <span className="text-[11px] text-neutral-400 capitalize truncate block">
                          {org.industry || org.type || 'Company'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link to={`/organizations/${orgId}`}>
                        <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                          View
                        </Button>
                      </Link>
                      {onUnsaveStartup && (
                        <button
                          onClick={() => onUnsaveStartup(orgId)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Jobs Sub Tab */}
      {activeSubTab === 'jobs' && (
        <div>
          {savedJobs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-50 text-center border border-neutral-200/80">
              <Briefcase className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-neutral-500 mb-3">No bookmarked career positions.</p>
              <Link to="/jobs">
                <Button variant="secondary" size="sm" className="text-xs">
                  Explore Opportunities
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedJobs.map((item) => {
                const job = item.job || item;
                const jobId = job._id || job.id;
                const org = job.organization || {};

                return (
                  <div
                    key={jobId}
                    className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-amber-300 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {job.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {org.name || 'Startup'} • {job.workplaceType || 'Remote'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link to={`/jobs/${job.slug || jobId}`}>
                        <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                          View
                        </Button>
                      </Link>
                      {onUnsaveJob && (
                        <button
                          onClick={() => onUnsaveJob(jobId)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Events Sub Tab */}
      {activeSubTab === 'events' && (
        <div>
          {savedEvents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-50 text-center border border-neutral-200/80">
              <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-neutral-500 mb-3">No saved events or demo days.</p>
              <Link to="/events">
                <Button variant="secondary" size="sm" className="text-xs">
                  Browse Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedEvents.map((item) => {
                const ev = item.event || item;
                const evId = ev._id || ev.id;

                return (
                  <div
                    key={evId}
                    className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-amber-300 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {ev.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {ev.startDate ? formatDate(ev.startDate) : 'Upcoming'} • {ev.eventType || 'Webinar'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link to={`/events/${ev.slug || evId}`}>
                        <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                          View
                        </Button>
                      </Link>
                      {onUnsaveEvent && (
                        <button
                          onClick={() => onUnsaveEvent(evId)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
