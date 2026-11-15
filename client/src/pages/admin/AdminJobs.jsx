import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Star,
  Trash2,
  ExternalLink,
  Eye,
  TrendingUp,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatters';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await adminService.getJobs(params);
      const list = Array.isArray(res) ? res : res.jobs || [];
      setJobs(list);
    } catch (err) {
      console.warn('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleModerate = async (jobId, action, isFeatured = false) => {
    if (action === 'remove' && !window.confirm('Are you sure you want to take down this job listing?')) {
      return;
    }

    setActionLoading(jobId);
    try {
      await adminService.moderateJob(jobId, action, '', isFeatured);
      await fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to moderate job');
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
            <Briefcase className="w-4 h-4 text-amber-600" /> Career Moderation
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Startup Job Postings & Redirection Engine</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Feature premier career listings, monitor outbound application click conversions, and remove scam postings.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by job title, venture, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed / Expired</option>
        </select>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <span className="text-xs text-neutral-500">Querying job postings...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 text-neutral-400">
          <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No career opportunities matching filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Role & Venture</th>
                  <th className="py-4 px-6">Workplace & Type</th>
                  <th className="py-4 px-6">Performance</th>
                  <th className="py-4 px-6">Status & Badge</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {jobs.map((job) => {
                  const isFeatured = job.isFeatured;

                  return (
                    <tr key={job._id || job.id} className="hover:bg-neutral-50/50 transition">
                      <td className="py-4 px-6">
                        <div>
                          <Link
                            to={`/jobs/${job.slug || job._id}`}
                            className="font-bold text-charcoal hover:text-amber-700 transition"
                          >
                            {job.title}
                          </Link>
                          <span className="text-[11px] text-neutral-400 block mt-0.5">
                            {job.organization?.name || 'Hiring Venture'} • {job.department || 'Engineering'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-neutral-600">
                        <div>{job.employmentType || 'Full-time'}</div>
                        <div className="text-[11px] text-neutral-400">{job.workplaceType || 'Remote'}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 text-neutral-500">
                          <span className="flex items-center gap-1" title="Views">
                            <Eye className="w-3.5 h-3.5" /> {job.viewsCount || 0}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-amber-700" title="Apply clicks">
                            <ExternalLink className="w-3.5 h-3.5" /> {job.applyClicksCount || 0}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              job.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {job.status || 'Active'}
                          </span>

                          {isFeatured && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={actionLoading === job._id}
                            onClick={() => handleModerate(job._id, 'feature', !isFeatured)}
                            className={`p-1.5 rounded-lg transition ${
                              isFeatured ? 'text-amber-600 bg-amber-50' : 'text-neutral-400 hover:text-amber-600'
                            }`}
                            title={isFeatured ? 'Unpin featured role' : 'Feature role on board'}
                          >
                            <Star className="w-4 h-4" />
                          </button>

                          <Link to={`/jobs/${job.slug || job._id}`}>
                            <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                              View
                            </Button>
                          </Link>

                          <button
                            disabled={actionLoading === job._id}
                            onClick={() => handleModerate(job._id, 'remove')}
                            className="p-1.5 text-neutral-400 hover:text-red-600 transition"
                            title="Takedown / Delete listing"
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
        </div>
      )}
    </div>
  );
}
