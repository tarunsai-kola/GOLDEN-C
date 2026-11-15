import { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Spinner from '../../components/ui/Spinner';
import { formatDate, formatRelativeTime } from '../../utils/helpers';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;

      const res = await adminService.getAuditLogs(params);
      const list = Array.isArray(res) ? res : res.logs || [];
      setLogs(list);
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <ScrollText className="w-4 h-4 text-amber-600" /> Compliance Audit Trail
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Administrative Action & Governance Log</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Immutable log of all executive role changes, moderation decisions, suspensions, and badge approvals.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by action, administrator name, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <span className="text-xs text-neutral-500">Querying immutable audit database...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 text-neutral-400">
          <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No audit logs matching search</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Administrator</th>
                  <th className="py-4 px-6">Target Entity</th>
                  <th className="py-4 px-6">Details / Note</th>
                  <th className="py-4 px-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-neutral-50/50 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-charcoal bg-neutral-100 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-charcoal">
                        {log.adminUser?.fullName || log.adminEmail || 'SuperAdmin'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {log.ipAddress || 'Internal SSL'}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-neutral-600 font-medium capitalize">
                      {log.targetType || 'System'}: {log.targetId ? String(log.targetId).slice(-6) : '—'}
                    </td>

                    <td className="py-4 px-6 text-neutral-500 max-w-xs truncate">
                      {typeof log.details === 'object' && log.details !== null
                        ? JSON.stringify(log.details)
                        : (log.details || log.reason || log.note || 'Executed via Governance API')}
                    </td>

                    <td className="py-4 px-6 text-right text-neutral-400 whitespace-nowrap">
                      {log.createdAt ? formatRelativeTime(log.createdAt) : 'Recently'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
