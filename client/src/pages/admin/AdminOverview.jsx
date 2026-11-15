import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Calendar,
  Briefcase,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  Sliders,
  BarChart3,
  ScrollText,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatRelativeTime } from '../../utils/helpers';

export default function AdminOverview() {
  const [metrics, setMetrics] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [metRes, logsRes] = await Promise.allSettled([
          adminService.getMetrics(),
          adminService.getAuditLogs({ limit: 5 }),
        ]);

        if (metRes.status === 'fulfilled') {
          setMetrics(metRes.value);
        }

        if (logsRes.status === 'fulfilled') {
          const list = Array.isArray(logsRes.value) ? logsRes.value : logsRes.value?.logs || [];
          setRecentLogs(list);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-neutral-500">Loading ecosystem command telemetry...</span>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Platform Users',
      value: metrics?.totalUsers || 0,
      sub: `${metrics?.activeUsers || 0} active recently`,
      icon: Users,
      to: '/admin/users',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Verified Ventures',
      value: metrics?.totalOrganizations || 0,
      sub: `${metrics?.pendingVerifications || 0} pending badge review`,
      icon: Building2,
      to: '/admin/organizations',
      color: 'text-amber-600 bg-amber-50',
      badge: metrics?.pendingVerifications ? `${metrics.pendingVerifications} Pending` : null,
    },
    {
      label: 'Ecosystem Events',
      value: metrics?.totalEvents || 0,
      sub: `${metrics?.pendingEvents || 0} awaiting moderation`,
      icon: Calendar,
      to: '/admin/events',
      color: 'text-purple-600 bg-purple-50',
      badge: metrics?.pendingEvents ? `${metrics.pendingEvents} Review` : null,
    },
    {
      label: 'Trust & Safety Reports',
      value: metrics?.pendingReports || 0,
      sub: 'Open incidents / flagged items',
      icon: ShieldAlert,
      to: '/admin/moderation',
      color: 'text-red-600 bg-red-50',
      badge: metrics?.pendingReports ? 'Action Required' : null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-8 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-amber-700">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> Platform Governance Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal tracking-tight font-serif">
            Executive Command Center
          </h1>
          <p className="text-xs text-neutral-600 mt-1 max-w-xl">
            Real-time telemetry, venture credential approvals, content moderation, and audit compliance logging across The Golden Circle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/analytics">
            <Button variant="secondary" size="sm" className="gap-2 text-xs">
              <BarChart3 className="w-3.5 h-3.5 text-neutral-500" /> View Analytics
            </Button>
          </Link>
          <Link to="/admin/config">
            <Button variant="primary" size="sm" className="gap-2 text-xs shadow-xs">
              <Sliders className="w-3.5 h-3.5" /> Platform Config
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.to}>
              <Card hover padding="md" className="border-neutral-200 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-2xl ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {card.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-charcoal">{card.value.toLocaleString()}</div>
                  <div className="text-xs font-semibold text-neutral-800 mt-1">{card.label}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{card.sub}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-amber-700">
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Action Center & Quick Governance Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Tasks */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-4">
          <h3 className="font-bold text-charcoal text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Executive Governance Queues
          </h3>
          <p className="text-xs text-neutral-500">Immediate approval and moderation workflows pending your review.</p>

          <div className="divide-y divide-neutral-100">
            <Link
              to="/admin/organizations"
              className="py-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50 -mx-4 px-4 rounded-xl transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-charcoal">Venture Verification Badge Review</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Review legal claims, pitch decks, and corporate evidence for the Golden Circle checkmark.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                {metrics?.pendingVerifications || 0} Pending
              </span>
            </Link>

            <Link
              to="/admin/events"
              className="py-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50 -mx-4 px-4 rounded-xl transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-charcoal">Demo Days & Masterclasses Moderation</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Approve submitted community webinars or pin featured summits to the ecosystem discovery page.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                {metrics?.pendingEvents || 0} In Review
              </span>
            </Link>

            <Link
              to="/admin/moderation"
              className="py-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50 -mx-4 px-4 rounded-xl transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-red-50 text-red-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-charcoal">Trust & Safety Incident Reports</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Flagged job postings, spam profiles, and abusive message reports requiring resolution.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-xl">
                {metrics?.pendingReports || 0} Reports
              </span>
            </Link>

            <Link
              to="/admin/cms"
              className="py-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50 -mx-4 px-4 rounded-xl transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-charcoal">Editorial & Founder Spotlight CMS</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Publish curated founder stories, interviews, and syndicated articles with consent tracking.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-neutral-400">Open Studio</span>
            </Link>
          </div>
        </div>

        {/* Real-time Audit Trail Preview */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-charcoal text-base flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-neutral-500" />
                Compliance Audit Trail
              </h3>
              <Link to="/admin/audit-logs" className="text-xs text-amber-700 hover:underline font-semibold">
                All Logs
              </Link>
            </div>
            <p className="text-xs text-neutral-500 mb-4">Immutable log of administrative operations.</p>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl">
                  No recent audit entries recorded.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log._id || log.id} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-charcoal truncate">{log.action}</span>
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                        {log.createdAt ? formatRelativeTime(log.createdAt) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                      {typeof log.details === 'object' && log.details !== null
                        ? JSON.stringify(log.details)
                        : (log.details || log.reason || log.targetType || 'Audit entry')}
                    </p>
                    <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                      Admin: {log.adminUser?.fullName || 'SuperAdmin'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
            <span>SOC2 Audit Compliant</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tamper-Proof
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
