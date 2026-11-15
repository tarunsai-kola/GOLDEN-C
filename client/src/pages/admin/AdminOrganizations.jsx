import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sparkles,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatters';

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.verificationStatus = statusFilter;

      const res = await adminService.getOrganizations(params);
      const list = Array.isArray(res) ? res : res.organizations || [];
      setOrganizations(list);
    } catch (err) {
      console.warn('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter]);

  const handleVerify = async (orgId, status) => {
    const note = window.prompt(`Enter note/reason for setting status to ${status.toUpperCase()}:`, '');
    if (note === null) return;

    setActionLoading(orgId);
    try {
      await adminService.verifyOrganization(orgId, status, note);
      setOrganizations((prev) =>
        prev.map((o) =>
          o._id === orgId ? { ...o, verificationStatus: status, isVerified: status === 'verified' } : o
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update verification status');
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
            <Building2 className="w-4 h-4 text-amber-600" /> Venture Verification
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Venture Registry & Golden Badge Review</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Grant verified ecosystem credentials, approve company claim requests, and validate corporate legitimacy.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by company name, industry, or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrganizations()}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-auto"
        >
          <option value="all">All Verification Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="verified">Verified Badge</option>
          <option value="unverified">Unverified</option>
          <option value="needs_evidence">Needs Evidence</option>
        </select>
      </div>

      {/* Organizations Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <span className="text-xs text-neutral-500">Querying venture registry...</span>
        </div>
      ) : organizations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 text-neutral-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No organizations matching filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Organization</th>
                  <th className="py-4 px-6">Industry & Stage</th>
                  <th className="py-4 px-6">Verification Badge</th>
                  <th className="py-4 px-6">Founded</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {organizations.map((org) => {
                  const isVerified = org.isVerified || org.verificationStatus === 'verified';
                  const isPending = org.verificationStatus === 'pending';

                  return (
                    <tr key={org._id || org.id} className="hover:bg-neutral-50/50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-amber-800 text-xs flex-shrink-0 overflow-hidden">
                            {org.logo ? (
                              <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                            ) : (
                              (org.name || 'GC').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/organizations/${org._id || org.id}`}
                              className="font-bold text-charcoal hover:text-amber-700 transition flex items-center gap-1.5"
                            >
                              <span>{org.name}</span>
                              {isVerified && <ShieldCheck className="w-3.5 h-3.5 text-amber-600 inline" />}
                            </Link>
                            <span className="text-[11px] text-neutral-400 block truncate max-w-xs">
                              {org.tagline || 'Ecosystem Startup'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-charcoal font-medium">{org.industry || 'Technology'}</div>
                        <div className="text-[11px] text-neutral-400 capitalize">{org.stage || 'Seed'}</div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isVerified
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : isPending
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-amber-600" /> Verified
                            </>
                          ) : isPending ? (
                            'Pending Review'
                          ) : (
                            'Unverified'
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-neutral-500">
                        {org.foundedYear || (org.createdAt ? formatDate(org.createdAt) : '—')}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/organizations/${org._id || org.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                              Profile
                            </Button>
                          </Link>

                          {!isVerified ? (
                            <Button
                              size="sm"
                              variant="primary"
                              loading={actionLoading === org._id}
                              onClick={() => handleVerify(org._id, 'verified')}
                              className="text-xs px-2.5 py-1 gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Approve Badge
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={actionLoading === org._id}
                              onClick={() => handleVerify(org._id, 'unverified')}
                              className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50"
                            >
                              Revoke
                            </Button>
                          )}
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
