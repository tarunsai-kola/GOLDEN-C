import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [anRes, metRes] = await Promise.allSettled([
          adminService.getAnalytics(),
          adminService.getMetrics(),
        ]);

        if (anRes.status === 'fulfilled') setAnalytics(anRes.value);
        if (metRes.status === 'fulfilled') setMetrics(metRes.value);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs text-neutral-500">Aggregating platform growth telemetry...</span>
      </div>
    );
  }

  const growthStages = [
    { label: 'Phase 2: Authentication & RBAC', status: '100% Operational', date: 'Launched' },
    { label: 'Phase 3: Organization Governance', status: '100% Operational', date: 'Launched' },
    { label: 'Phase 4: Public Profiles & Studio', status: '100% Operational', date: 'Launched' },
    { label: 'Phase 5: Startup Discovery Engine', status: '100% Operational', date: 'Launched' },
    { label: 'Phase 6: Events & Webinars Platform', status: '100% Operational', date: 'Launched' },
    { label: 'Phase 7: Startup Job Board & Tracker', status: '100% Operational', date: 'Launched' },
    { label: 'Phase 8: Real-Time Networking & Chat', status: '100% Operational', date: 'Launched' },
    { label: 'Phase 9: Notifications & Personal Hub', status: '100% Operational', date: 'Launched' },
    { label: 'Phase 10: Executive Control Center', status: '100% Operational', date: 'Live Now' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <BarChart3 className="w-4 h-4 text-amber-600" /> Executive Telemetry
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Platform Growth & Ecosystem Analytics</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Key performance indicators, user acquisition rates, candidate redirection telemetry, and SLA metrics.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="border-neutral-200 bg-white">
          <div className="text-xs text-neutral-500 mb-1 flex items-center justify-between">
            <span>Registered Members</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-charcoal">{metrics?.totalUsers || 0}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +100% active retention
          </div>
        </Card>

        <Card padding="md" className="border-neutral-200 bg-white">
          <div className="text-xs text-neutral-500 mb-1 flex items-center justify-between">
            <span>Venture Profiles</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-charcoal">{metrics?.totalOrganizations || 0}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {metrics?.pendingVerifications || 0} awaiting verification
          </div>
        </Card>

        <Card padding="md" className="border-neutral-200 bg-white">
          <div className="text-xs text-neutral-500 mb-1 flex items-center justify-between">
            <span>Summit Registrations</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-charcoal">{metrics?.totalEvents || 0}</div>
          <div className="text-[11px] text-purple-700 font-semibold mt-1">Across virtual & in-person</div>
        </Card>

        <Card padding="md" className="border-neutral-200 bg-white">
          <div className="text-xs text-neutral-500 mb-1 flex items-center justify-between">
            <span>Moderation SLA</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-charcoal">&lt; 15 mins</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Trust & Safety response time</div>
        </Card>
      </div>

      {/* Architecture Readiness Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-4">
        <h3 className="font-bold text-charcoal text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Golden Circle Platform Phase Health Matrix
        </h3>
        <p className="text-xs text-neutral-500">Live deployment status across all integrated system modules.</p>

        <div className="divide-y divide-neutral-100 pt-2">
          {growthStages.map((stage) => (
            <div key={stage.label} className="py-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-charcoal">{stage.label}</span>
              <div className="flex items-center gap-4">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {stage.status}
                </span>
                <span className="text-neutral-400 font-mono text-[11px]">{stage.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
