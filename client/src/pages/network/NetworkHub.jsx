import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Search,
  MessageSquare,
  Sparkles,
  Building2,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import networkService from '../../services/network.service';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ConnectionCard from '../../components/network/ConnectionCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export default function NetworkHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openChatWithUser } = useChat();

  const [activeTab, setActiveTab] = useState('connections'); // 'connections' | 'requests' | 'discover'
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [discoverPeers, setDiscoverPeers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connRes, reqRes, discRes] = await Promise.allSettled([
        networkService.getConnections(),
        networkService.getRequests(),
        networkService.discoverPeers(),
      ]);

      if (connRes.status === 'fulfilled') {
        const list = Array.isArray(connRes.value) ? connRes.value : connRes.value?.connections || [];
        setConnections(list);
      }

      if (reqRes.status === 'fulfilled') {
        setRequests(reqRes.value || { received: [], sent: [] });
      }

      if (discRes.status === 'fulfilled') {
        const list = Array.isArray(discRes.value) ? discRes.value : discRes.value?.users || [];
        setDiscoverPeers(list);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Connection Actions
  const handleAccept = async (connectionId) => {
    try {
      await networkService.acceptRequest(connectionId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to accept connection request');
    }
  };

  const handleReject = async (connectionId) => {
    try {
      await networkService.rejectRequest(connectionId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to decline connection request');
    }
  };

  const handleCancel = async (connectionId) => {
    try {
      await networkService.cancelRequest(connectionId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to cancel invitation');
    }
  };

  const handleRemove = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return;
    try {
      await networkService.removeConnection(targetUserId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to remove connection');
    }
  };

  const handleConnect = async (targetUserId) => {
    const note = window.prompt('Add a personalized note to your connection request (optional):', '');
    if (note === null) return; // user cancelled
    try {
      await networkService.sendRequest(targetUserId, note);
      alert('Connection invitation sent successfully!');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to send connection invitation');
    }
  };

  const handleMessage = async (targetUserId) => {
    try {
      const conv = await openChatWithUser(targetUserId);
      navigate(`/messages/${conv._id || conv.id}`);
    } catch (err) {
      alert(err.message || 'Could not initiate chat');
    }
  };

  // Filter connections by search
  const filteredConnections = connections.filter((conn) => {
    const peer = conn.user || conn.peer || conn;
    return (
      !searchQuery ||
      peer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const pendingCount = (requests.received?.length || 0) + (requests.sent?.length || 0);

  return (
    <div className="min-h-screen bg-neutral-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero Banner */}
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-700 uppercase mb-2">
                <Users className="w-4 h-4 text-amber-600" />
                Founders & Operators Syndicate
              </div>
              <h1 className="text-3xl font-bold text-charcoal tracking-tight font-serif">
                Golden Circle Network
              </h1>
              <p className="mt-2 text-neutral-600 max-w-2xl text-sm leading-relaxed">
                Connect with verified founders, investors, and talent. Direct messaging is unlocked once connections are mutual, maintaining the utmost executive privacy.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/messages">
                <Button size="md" variant="secondary" className="gap-2 shadow-xs">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  Open Direct Messages
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-100">
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/80">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>My Connections</span>
                <UserCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-charcoal">{connections.length}</div>
              <div className="text-xs text-neutral-500 mt-1">Verified direct contacts</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Pending Invites</span>
                <Clock className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-2xl font-bold text-charcoal">{pendingCount}</div>
              <div className="text-xs text-neutral-500 mt-1">
                {requests.received?.length || 0} received • {requests.sent?.length || 0} sent
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 col-span-2 sm:col-span-1">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Security Protocol</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-emerald-950 mt-1">100% Opt-in Network</div>
              <div className="text-xs text-emerald-700 mt-0.5">Spam-free direct messaging</div>
            </div>
          </div>
        </div>

        {/* Tab & Search Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'connections'
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'text-neutral-600 hover:text-charcoal hover:bg-neutral-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              My Connections ({connections.length})
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'text-neutral-600 hover:text-charcoal hover:bg-neutral-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Invitations
              {requests.received?.length > 0 && (
                <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {requests.received.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'discover'
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'text-neutral-600 hover:text-charcoal hover:bg-neutral-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Discover Members
            </button>
          </div>

          {activeTab === 'connections' && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-neutral-500">Loading your network syndicate...</p>
          </div>
        ) : (
          <>
            {/* Tab 1: My Connections */}
            {activeTab === 'connections' && (
              <div>
                {filteredConnections.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/80 shadow-sm">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-charcoal">No connections found</h3>
                    <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                      {searchQuery
                        ? 'No contacts match your search terms.'
                        : 'You haven’t connected with other members yet. Discover founders and grow your circle.'}
                    </p>
                    <div className="mt-6">
                      <Button
                        size="md"
                        variant="secondary"
                        onClick={() => setActiveTab('discover')}
                        className="gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Discover People to Connect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredConnections.map((conn) => {
                      const peer = conn.user || conn.peer || conn;
                      return (
                        <ConnectionCard
                          key={conn._id || peer._id}
                          user={peer}
                          type="connected"
                          onMessage={handleMessage}
                          onRemove={handleRemove}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Pending Invitations */}
            {activeTab === 'requests' && (
              <div className="space-y-8">
                {/* Received Invitations */}
                <div>
                  <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span>Received Invitations ({requests.received?.length || 0})</span>
                  </h3>
                  {requests.received?.length === 0 ? (
                    <div className="p-8 bg-white rounded-3xl border border-neutral-200 text-center text-neutral-500 text-xs">
                      No pending connection requests received.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {requests.received.map((req) => (
                        <ConnectionCard
                          key={req._id}
                          user={req.sender || req.user}
                          type="received"
                          connectionId={req._id}
                          note={req.note}
                          onAccept={handleAccept}
                          onReject={handleReject}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent Invitations */}
                <div>
                  <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">
                    Sent Invitations ({requests.sent?.length || 0})
                  </h3>
                  {requests.sent?.length === 0 ? (
                    <div className="p-8 bg-white rounded-3xl border border-neutral-200 text-center text-neutral-500 text-xs">
                      You have no outgoing invitations awaiting response.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {requests.sent.map((req) => (
                        <ConnectionCard
                          key={req._id}
                          user={req.recipient || req.user}
                          type="sent"
                          connectionId={req._id}
                          note={req.note}
                          onCancel={handleCancel}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Discover Members */}
            {activeTab === 'discover' && (
              <div>
                {discoverPeers.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/80 shadow-sm">
                    <Sparkles className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                    <h3 className="text-base font-bold text-charcoal">No suggestions available</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      All active ecosystem members are currently in your connections or pending requests!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discoverPeers.map((peer) => (
                      <ConnectionCard
                        key={peer._id}
                        user={peer}
                        type="discover"
                        onConnect={handleConnect}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
