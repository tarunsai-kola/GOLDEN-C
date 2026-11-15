import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  PlusCircle,
  Eye,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import jobService from '../../services/job.service';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatters';

export default function JobManagementDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myOrganizations, activeOrg } = useOrganization();
  const isAdmin = user?.role === 'admin';

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'draft' | 'closed'
  const [selectedOrgId, setSelectedOrgId] = useState(activeOrg?._id || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // If admin, or recruiter of specific org
      const params = { limit: 100 };
      if (selectedOrgId && selectedOrgId !== 'all') {
        params.organization = selectedOrgId;
      }
      const res = await jobService.getJobs(params);
      const list = res.data || (Array.isArray(res) ? res : []);
      setJobs(list);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedOrgId]);

  const handleStatusToggle = async (jobId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      setUpdatingId(jobId);
      await jobService.updateJobStatus(jobId, nextStatus);
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, status: nextStatus } : j))
      );
    } catch (err) {
      alert(err.message || 'Failed to update job status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to permanently delete this job listing?')) {
      return;
    }
    try {
      setDeletingId(jobId);
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      alert(err.message || 'Failed to delete job');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter listings
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : job.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalRoles = jobs.length;
  const activeRoles = jobs.filter((j) => j.status === 'active').length;
  const totalViews = jobs.reduce((sum, j) => sum + (j.viewsCount || 0), 0);
  const totalApplies = jobs.reduce((sum, j) => sum + (j.applyClicksCount || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalApplies / totalViews) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-neutral-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job Board
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/jobs/new">
              <Button size="sm" className="gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                Post New Role
              </Button>
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-700 uppercase mb-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                Talent Operations
              </div>
              <h1 className="text-3xl font-bold text-charcoal tracking-tight font-serif">
                Recruitment & Job Management
              </h1>
              <p className="mt-2 text-neutral-600 max-w-2xl text-sm leading-relaxed">
                Oversee open positions across your ventures, track candidate redirection conversion rates, and manage external application links seamlessly.
              </p>
            </div>

            {/* Org Switcher if multiple orgs */}
            {myOrganizations.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200">
                <span className="text-xs font-semibold text-neutral-500 pl-2">Venture:</span>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="bg-white text-sm font-medium text-charcoal border border-neutral-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Ventures ({myOrganizations.length})</option>
                  {myOrganizations.map((entry) => {
                    const org = entry.organization || entry;
                    return (
                      <option key={org._id || org.id} value={org._id || org.id}>
                        {org.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Metric Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-neutral-100">
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/80">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Active Roles</span>
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-charcoal">{activeRoles}</div>
              <div className="text-xs text-neutral-500 mt-1">{totalRoles} total posted</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Total Views</span>
                <Eye className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-2xl font-bold text-charcoal">{totalViews.toLocaleString()}</div>
              <div className="text-xs text-neutral-500 mt-1">Impressions across board</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Apply Clicks</span>
                <ExternalLink className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-2xl font-bold text-charcoal">{totalApplies.toLocaleString()}</div>
              <div className="text-xs text-neutral-500 mt-1">Outbound redirects</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Apply Click-Through</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-charcoal">{conversionRate}%</div>
              <div className="text-xs text-emerald-700 mt-1">Application interest index</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-2xl overflow-x-auto shadow-sm">
            {[
              { id: 'all', label: 'All Postings', count: totalRoles },
              { id: 'active', label: 'Active', count: activeRoles },
              { id: 'closed', label: 'Closed / Expired', count: totalRoles - activeRoles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.id
                    ? 'bg-charcoal text-white shadow-sm'
                    : 'text-neutral-600 hover:text-charcoal hover:bg-neutral-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter by title, dept, or venture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Job Listings List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-neutral-500">Loading career listings...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/80 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-charcoal">No job listings found</h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search query or status filter to see other positions.'
                : 'Your organization has not published any open roles yet. Start attracting top tier talent today.'}
            </p>
            <div className="mt-6 flex justify-center">
              <Link to="/jobs/new">
                <Button size="md" className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Post First Opportunity
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    <th className="py-4 px-6">Job Position</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Type & Location</th>
                    <th className="py-4 px-6 text-center">Performance</th>
                    <th className="py-4 px-6">External Link</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredJobs.map((job) => {
                    const isClosed = job.status === 'closed';
                    const org = job.organization || {};
                    return (
                      <tr
                        key={job._id}
                        className="hover:bg-neutral-50/50 transition-colors group"
                      >
                        {/* Title & Organization */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-amber-700 text-xs">
                              {org.logo ? (
                                <img
                                  src={org.logo}
                                  alt={org.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (org.name || 'GC').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <Link
                                to={`/jobs/${job.slug || job._id}`}
                                className="font-semibold text-charcoal hover:text-amber-600 transition-colors"
                              >
                                {job.title}
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                                <span>{org.name || 'Venture'}</span>
                                <span>•</span>
                                <span className="font-medium text-neutral-600">
                                  {job.department}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              job.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : job.status === 'draft'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                job.status === 'active'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : job.status === 'draft'
                                  ? 'bg-amber-500'
                                  : 'bg-neutral-400'
                              }`}
                            />
                            {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Active'}
                          </span>
                        </td>

                        {/* Type & Location */}
                        <td className="py-4 px-6">
                          <div className="text-xs text-charcoal font-medium">
                            {job.employmentType}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {job.workplaceType} • {job.location || 'Remote'}
                          </div>
                        </td>

                        {/* Performance (Views & Clicks) */}
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center gap-4 bg-neutral-50 border border-neutral-200/80 px-3 py-1.5 rounded-xl text-xs">
                            <div
                              className="flex items-center gap-1 text-neutral-600"
                              title="Total page views"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-400" />
                              <span className="font-semibold">{job.viewsCount || 0}</span>
                            </div>
                            <div className="w-px h-3 bg-neutral-300" />
                            <div
                              className="flex items-center gap-1 text-amber-700 font-semibold"
                              title="External apply clicks"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                              <span>{job.applyClicksCount || 0}</span>
                            </div>
                          </div>
                        </td>

                        {/* External Application Link */}
                        <td className="py-4 px-6">
                          {job.applicationUrl ? (
                            <a
                              href={job.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-amber-600 truncate max-w-[180px] font-mono group/link"
                            >
                              <ExternalLink className="w-3 h-3 text-neutral-400 group-hover/link:text-amber-600 flex-shrink-0" />
                              <span className="truncate">{job.applicationUrl.replace(/^https?:\/\//, '')}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">None specified</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Active / Closed */}
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={updatingId === job._id}
                              onClick={() => handleStatusToggle(job._id, job.status)}
                              className={`!px-2.5 !py-1 text-xs ${
                                isClosed
                                  ? 'text-emerald-700 hover:bg-emerald-50'
                                  : 'text-amber-700 hover:bg-amber-50'
                              }`}
                            >
                              {isClosed ? 'Reopen' : 'Close'}
                            </Button>

                            {/* View live link */}
                            <Link to={`/jobs/${job.slug || job._id}`}>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="!px-2.5 !py-1 text-xs"
                              >
                                View
                              </Button>
                            </Link>

                            {/* Delete */}
                            <button
                              disabled={deletingId === job._id}
                              onClick={() => handleDelete(job._id)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete job listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>Showing {filteredJobs.length} of {jobs.length} total postings</span>
              <span>All candidate redirection interactions are logged securely</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
