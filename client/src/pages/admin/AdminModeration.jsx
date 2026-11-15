import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Flag,
  UserX,
  Trash2,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate, formatRelativeTime } from '../../utils/helpers';

export default function AdminModeration() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await adminService.getReports(params);
      const list = Array.isArray(res) ? res : res.reports || [];
      setReports(list);
    } catch (err) {
      console.warn('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleResolve = async (reportId, resolution, actionType) => {
    const note = window.prompt(`Enter resolution note for ${resolution.toUpperCase()} (${actionType}):`, '');
    if (note === null) return;

    setActionLoading(reportId);
    try {
      await adminService.resolveReport(reportId, resolution, actionType, note);
      await fetchReports();
    } catch (err) {
      alert(err.message || 'Failed to resolve moderation report');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Trust & Safety Moderation
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Community Incident Queue</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Resolve member reports, take down malicious postings, and enforce zero-tolerance harassment policies.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="pending">Pending Action</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All Incidents</option>
        </select>
      </div>

      {/* Reports Feed */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <span className="text-xs text-neutral-500">Querying Trust & Safety incident queue...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 text-neutral-400">
          <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-60" />
          <h3 className="font-bold text-charcoal text-sm">No Pending Safety Incidents</h3>
          <p className="text-xs text-neutral-500 mt-0.5">The platform community is safe and operating within guidelines.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isPending = report.status === 'pending';

            return (
              <div
                key={report._id || report.id}
                className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl flex-shrink-0">
                    <Flag className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                        {report.reason || 'Harassment / Safety Report'}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-[11px] text-neutral-400 capitalize">
                        Target: {report.targetType || 'Content'}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-[10px] text-neutral-400">
                        {report.createdAt ? formatRelativeTime(report.createdAt) : 'Recently'}
                      </span>
                    </div>

                    <h4 className="font-bold text-charcoal text-sm">
                      Reported by {report.reporter?.fullName || report.reporter?.email || 'Anonymous Member'}
                    </h4>

                    {report.details && (
                      <p className="text-xs text-neutral-600 mt-1 italic bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/60">
                        "{report.details}"
                      </p>
                    )}

                    {report.resolutionNote && (
                      <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl">
                        Resolution: {report.resolutionNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Moderation Resolution Actions */}
                {isPending && (
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      loading={actionLoading === report._id}
                      onClick={() => handleResolve(report._id, 'resolved', 'content_removed')}
                      className="text-xs gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Content
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      loading={actionLoading === report._id}
                      onClick={() => handleResolve(report._id, 'resolved', 'user_suspended')}
                      className="text-xs gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" /> Suspend Offender
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      loading={actionLoading === report._id}
                      onClick={() => handleResolve(report._id, 'dismissed', 'none')}
                      className="text-xs text-neutral-500 hover:bg-neutral-100"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
