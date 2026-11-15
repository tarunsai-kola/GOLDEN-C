import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  MapPin,
  Shield,
  LogOut,
  Building2,
  Briefcase,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Bookmark,
  Compass,
  Video,
  Ticket,
  Users,
  MessageSquare,
  Settings,
  Bell,
  Heart,
  Clock,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { useChat } from '../context/ChatContext';
import discoveryService from '../services/discovery.service';
import eventService from '../services/event.service';
import jobService from '../services/job.service';
import networkService from '../services/network.service';
import followService from '../services/follow.service';
import savedItemService from '../services/savedItem.service';
import dashboardService from '../services/dashboard.service';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

import ProfileCompletionCard from '../components/dashboard/ProfileCompletionCard';
import SavedItemsHub from '../components/dashboard/SavedItemsHub';
import FollowedEntitiesGrid from '../components/dashboard/FollowedEntitiesGrid';
import UpcomingRegistrationsList from '../components/dashboard/UpcomingRegistrationsList';
import NotificationPreferencesModal from '../components/dashboard/NotificationPreferencesModal';

import { generateInitials, formatDate, formatRelativeTime } from '../utils/helpers';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { unreadCount } = useChat();
  const { myOrganizations, switchOrganization } = useOrganization();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [loggingOut, setLoggingOut] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);

  // Data states
  const [savedStartups, setSavedStartups] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [followedEntities, setFollowedEntities] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState({ received: [], sent: [] });
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [
        dashRes,
        savedStartupsRes,
        eventsRes,
        jobsRes,
        followRes,
        connRes,
        reqRes,
      ] = await Promise.allSettled([
        dashboardService.getPersonalDashboard(),
        discoveryService.getSavedStartups(),
        eventService.getMyRegistrations(),
        jobService.getSavedJobs(),
        followService.getFollowedEntities(),
        networkService.getConnections(),
        networkService.getRequests(),
      ]);

      if (savedStartupsRes.status === 'fulfilled') {
        const list = savedStartupsRes.value.data || (Array.isArray(savedStartupsRes.value) ? savedStartupsRes.value : []);
        setSavedStartups(list);
      }

      if (eventsRes.status === 'fulfilled') {
        const evList = Array.isArray(eventsRes.value) ? eventsRes.value : [];
        setRegisteredEvents(evList);
      }

      if (jobsRes.status === 'fulfilled') {
        const jobList = jobsRes.value.data || (Array.isArray(jobsRes.value) ? jobsRes.value : []);
        setSavedJobs(jobList);
      }

      if (followRes.status === 'fulfilled') {
        const follows = Array.isArray(followRes.value) ? followRes.value : followRes.value?.data || [];
        setFollowedEntities(follows);
      }

      if (connRes.status === 'fulfilled') {
        const conns = Array.isArray(connRes.value) ? connRes.value : connRes.value?.connections || [];
        setConnections(conns);
      }

      if (reqRes.status === 'fulfilled') {
        setPendingRequests(reqRes.value || { received: [], sent: [] });
      }

      // Check dashboard aggregated payload if available
      if (dashRes.status === 'fulfilled' && dashRes.value) {
        if (dashRes.value.activities) setActivities(dashRes.value.activities);
        if (dashRes.value.savedEvents) setSavedEvents(dashRes.value.savedEvents);
      }
    } catch (err) {
      console.warn('Could not load dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  // Unsave Handlers
  const handleUnsaveStartup = async (orgId) => {
    try {
      await discoveryService.unsaveStartup(orgId);
      setSavedStartups((prev) => prev.filter((item) => (item._id || item.id || item.organization?._id) !== orgId));
    } catch (err) {
      alert('Failed to remove startup from watchlist');
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      await jobService.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((item) => (item._id || item.id || item.job?._id) !== jobId));
    } catch (err) {
      alert('Failed to remove job from saved');
    }
  };

  const handleUnsaveEvent = async (eventId) => {
    try {
      await savedItemService.unsaveItem('event', eventId);
      setSavedEvents((prev) => prev.filter((item) => (item._id || item.id || item.event?._id) !== eventId));
    } catch (err) {
      alert('Failed to remove event from saved');
    }
  };

  // Unfollow Handler
  const handleUnfollow = async (targetType, targetId) => {
    try {
      await followService.unfollow(targetType, targetId);
      setFollowedEntities((prev) =>
        prev.filter((item) => {
          const entity = item.target || item.organization || item.user || item;
          return (entity._id || entity.id) !== targetId;
        })
      );
    } catch (err) {
      alert('Failed to unfollow');
    }
  };

  const totalSavedCount = savedStartups.length + savedJobs.length + savedEvents.length;
  const initials = generateInitials(user?.fullName || 'User');

  return (
    <div className="min-h-screen bg-neutral-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Verification banner if pending */}
        {user?.status === 'pending' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                Your account is currently in <strong>Verification Pending</strong> status. Please verify your email to unlock all features.
              </span>
            </div>
            <Link to="/verify-account" className="font-semibold underline hover:text-amber-950">
              Verify Now
            </Link>
          </div>
        )}

        {/* Executive Header Banner */}
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-16 h-16 rounded-3xl object-cover border-2 border-amber-400 shadow-sm"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-3xl border-2 flex items-center justify-center font-bold text-lg shadow-sm"
                    style={{
                      borderColor: '#C9A84C',
                      color: '#A07830',
                      backgroundColor: '#FFFDF5',
                    }}
                  >
                    {initials}
                  </div>
                )}
                {user?.isEmailVerified && (
                  <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-white text-[10px]">
                    <CheckCircle className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Bio & Details */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Executive Workspace
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-xs text-neutral-500 capitalize">{user?.role || 'Member'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-charcoal tracking-tight font-serif">
                  Welcome back, {user?.fullName || 'Founder'}
                </h1>
                <p className="text-xs text-neutral-600 mt-1 max-w-xl">
                  {user?.headline || user?.bio || 'Curate your ventures, track invitations, and interact with the Golden Circle syndicate.'}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPrefsOpen(true)}
                className="text-xs gap-1.5 shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-neutral-500" />
                Notification Preferences
              </Button>

              <Link to="/organizations/new">
                <Button variant="primary" size="sm" className="text-xs gap-1.5 shadow-2xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Register Venture
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                loading={loggingOut}
                className="text-neutral-500 hover:text-red-600 text-xs gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-neutral-100">
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100/80">
              <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Network</span>
                <Users className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-charcoal">{connections.length}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Active Connections</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Watchlist</span>
                <Bookmark className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <div className="text-xl font-bold text-charcoal">{totalSavedCount}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Startups, Jobs & Events</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Tickets</span>
                <Ticket className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <div className="text-xl font-bold text-charcoal">{registeredEvents.length}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Masterclasses & Webinars</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Direct Messages</span>
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-charcoal">{unreadCount}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Unread messages</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-2xl shadow-sm mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Executive Overview', icon: Sparkles },
            { id: 'saved', label: `Saved Items (${totalSavedCount})`, icon: Bookmark },
            { id: 'followed', label: `Followed (${followedEntities.length})`, icon: Heart },
            { id: 'tickets', label: `Events & Tickets (${registeredEvents.length})`, icon: Ticket },
            { id: 'network', label: `Syndicate (${connections.length})`, icon: Users },
            { id: 'activity', label: 'Activity Stream', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-charcoal text-white shadow-xs'
                    : 'text-neutral-600 hover:text-charcoal hover:bg-neutral-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        {loadingData ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-xs text-neutral-500">Loading executive intelligence dashboard...</span>
          </div>
        ) : (
          <>
            {/* Tab 1: Executive Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Profile Completion Meter */}
                <ProfileCompletionCard user={user} />

                {/* Executive Syndicate & Direct Messages quick hub */}
                <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          Executive Syndicate & Direct Messages
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Private peer-to-peer connection engine for founders, investors, and startup talent.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Link to="/network">
                        <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                          <Users size={14} /> My Network ({connections.length})
                        </Button>
                      </Link>
                      <Link to="/messages">
                        <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                          <MessageSquare size={14} />
                          Open Messages
                          {unreadCount > 0 && (
                            <span className="ml-1 bg-white text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-neutral-500 font-medium">Direct Connections</span>
                        <div className="text-xl font-bold text-charcoal mt-1">{connections.length}</div>
                      </div>
                      <Link to="/network">
                        <span className="text-xs text-amber-700 hover:underline font-semibold">Manage</span>
                      </Link>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-neutral-500 font-medium">Pending Requests</span>
                        <div className="text-xl font-bold text-charcoal mt-1">
                          {(pendingRequests.received?.length || 0) + (pendingRequests.sent?.length || 0)}
                        </div>
                      </div>
                      <Link to="/network">
                        <span className="text-xs text-amber-700 hover:underline font-semibold">Review</span>
                      </Link>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-amber-800 font-medium">Unread Messages</span>
                        <div className="text-xl font-bold text-charcoal mt-1">{unreadCount}</div>
                      </div>
                      <Link to="/messages">
                        <span className="text-xs text-amber-700 hover:underline font-semibold">Reply</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Upcoming Events Preview */}
                {registeredEvents.length > 0 && (
                  <UpcomingRegistrationsList registrations={registeredEvents.slice(0, 3)} />
                )}

                {/* Ecosystem Activities Grid */}
                <div>
                  <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Golden Circle Platform Modules
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link to="/discover" className="block">
                      <Card hover padding="lg" className="border-amber-200 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                              <Compass className="h-6 w-6" />
                            </div>
                            <Badge variant="success">Phase 5 Live</Badge>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">Startup Discovery</h3>
                          <p className="text-xs text-neutral-500 mb-4">
                            Explore high-growth startups and filter by hiring status and funding.
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                          Search Startups <ChevronRight size={14} />
                        </div>
                      </Card>
                    </Link>

                    <Link to="/events" className="block">
                      <Card hover padding="lg" className="border-amber-200 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                              <Calendar className="h-6 w-6" />
                            </div>
                            <Badge variant="success">Phase 6 Live</Badge>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">Events & Webinars</h3>
                          <p className="text-xs text-neutral-500 mb-4">
                            RSVP to live pitch sessions, virtual webinars, and demo days.
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                          Browse Events <ChevronRight size={14} />
                        </div>
                      </Card>
                    </Link>

                    <Link to="/jobs" className="block">
                      <Card hover padding="lg" className="border-amber-200 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                              <Briefcase className="h-6 w-6" />
                            </div>
                            <Badge variant="success">Phase 7 Live</Badge>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">Startup Job Board</h3>
                          <p className="text-xs text-neutral-500 mb-4">
                            Explore high-impact venture roles and apply externally with click tracking.
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                          Explore Jobs <ChevronRight size={14} />
                        </div>
                      </Card>
                    </Link>

                    <Link to="/network" className="block">
                      <Card hover padding="lg" className="border-amber-200 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                              <Users className="h-6 w-6" />
                            </div>
                            <Badge variant="success">Phase 8 Live</Badge>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">Executive Network</h3>
                          <p className="text-xs text-neutral-500 mb-4">
                            Establish direct connections and message verified peers in real time.
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                          Open Syndicate <ChevronRight size={14} />
                        </div>
                      </Card>
                    </Link>
                  </div>
                </div>

                {/* Account Credentials Card */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Account Security & Credentials
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-xs text-neutral-500 block mb-1">Account ID</span>
                      <span className="text-xs font-mono font-medium text-neutral-800 break-all">
                        {user?._id || user?.id || '—'}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-xs text-neutral-500 block mb-1">Email Status</span>
                      <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                        {user?.isEmailVerified ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Verified
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Unverified
                          </>
                        )}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-xs text-neutral-500 block mb-1">Account Role</span>
                      <span className="text-xs font-semibold text-neutral-800 capitalize">
                        {user?.role || 'user'}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-xs text-neutral-500 block mb-1">Security Session</span>
                      <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Active & Protected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Saved Items */}
            {activeTab === 'saved' && (
              <SavedItemsHub
                savedStartups={savedStartups}
                savedJobs={savedJobs}
                savedEvents={savedEvents}
                onUnsaveStartup={handleUnsaveStartup}
                onUnsaveJob={handleUnsaveJob}
                onUnsaveEvent={handleUnsaveEvent}
              />
            )}

            {/* Tab 3: Followed Ventures & Founders */}
            {activeTab === 'followed' && (
              <FollowedEntitiesGrid
                followedEntities={followedEntities}
                onUnfollow={handleUnfollow}
              />
            )}

            {/* Tab 4: Events & Tickets */}
            {activeTab === 'tickets' && (
              <UpcomingRegistrationsList registrations={registeredEvents} />
            )}

            {/* Tab 5: Syndicate Connections */}
            {activeTab === 'network' && (
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      My Direct Connections ({connections.length})
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Mutual connections with direct messaging privileges.
                    </p>
                  </div>
                  <Link to="/network">
                    <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                      <Users size={14} /> Open Full Syndicate Hub
                    </Button>
                  </Link>
                </div>

                {connections.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-neutral-50 text-center border border-neutral-200/80">
                    <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-neutral-500 mb-3">No active connections yet.</p>
                    <Link to="/network">
                      <Button variant="secondary" size="sm" className="text-xs">
                        Discover Founders & Investors
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connections.map((conn) => {
                      const peer = conn.user || conn.peer || conn;
                      const peerId = peer._id || peer.id;
                      const peerInitials = generateInitials(peer.fullName || 'User');

                      return (
                        <div
                          key={peerId}
                          className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-amber-300 transition flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs flex-shrink-0"
                              style={{
                                borderColor: '#C9A84C',
                                color: '#A07830',
                                backgroundColor: '#FFFDF5',
                              }}
                            >
                              {peerInitials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm truncate">
                                {peer.fullName}
                              </h4>
                              <span className="text-[11px] text-neutral-400 truncate block">
                                {peer.headline || peer.organization?.name || 'Member'}
                              </span>
                            </div>
                          </div>

                          <Link to="/messages">
                            <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                              Message
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: Activity Stream */}
            {activeTab === 'activity' && (
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Recent Syndicate Activity
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Chronological ledger of your executive interactions across the platform.
                    </p>
                  </div>
                </div>

                {activities.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-neutral-50 text-center border border-neutral-200/80">
                    <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-neutral-500">
                      No recent activities recorded. Start by bookmarking startups or registering for upcoming events.
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-neutral-100 ml-4 pl-6 space-y-6">
                    {activities.map((act, idx) => (
                      <div key={act._id || idx} className="relative">
                        <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white" />
                        <h4 className="text-xs font-bold text-charcoal">{act.title || act.action}</h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{act.description}</p>
                        <span className="text-[10px] text-neutral-400 mt-1 block">
                          {act.createdAt ? formatRelativeTime(act.createdAt) : 'Recently'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
      />
    </div>
  );
}
