import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Sparkles,
  ArrowUpDown,
  Building2,
  X,
  Compass,
} from 'lucide-react';
import jobService from '../../services/job.service';
import JobCard from '../../components/jobs/JobCard';
import JobFilterSidebar from '../../components/jobs/JobFilterSidebar';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function JobDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    workplaceType: searchParams.get('workplaceType') || '',
    employmentTypes: searchParams.get('employmentType') ? searchParams.get('employmentType').split(',') : [],
    experienceLevels: searchParams.get('experience') ? searchParams.get('experience').split(',') : [],
    location: searchParams.get('location') || '',
  });

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Mobile drawer
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Saved job IDs cache
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gc_saved_jobs') || '[]');
    } catch {
      return [];
    }
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: searchQuery.trim() || undefined,
        workplaceType: filters.workplaceType || undefined,
        employmentType: filters.employmentTypes.length > 0 ? filters.employmentTypes.join(',') : undefined,
        experience: filters.experienceLevels.length > 0 ? filters.experienceLevels.join(',') : undefined,
        location: filters.location.trim() || undefined,
        sort: sortBy,
        page: currentPage,
        limit: 12,
      };

      const res = await jobService.getJobs(params);
      const list = res.data || (Array.isArray(res) ? res : []);
      setJobs(list);

      if (res.pagination) {
        setPagination(res.pagination);
      } else {
        setPagination({
          page: currentPage,
          limit: 12,
          total: list.length,
          totalPages: Math.ceil(list.length / 12) || 1,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy, currentPage]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      workplaceType: '',
      employmentTypes: [],
      experienceLevels: [],
      location: '',
    });
    setCurrentPage(1);
  };

  const handleToggleSave = async (jobId, willSave) => {
    let next;
    if (willSave) {
      next = [...savedJobIds, jobId];
      await jobService.saveJob(jobId);
    } else {
      next = savedJobIds.filter((id) => id !== jobId);
      await jobService.unsaveJob(jobId);
    }
    setSavedJobIds(next);
    localStorage.setItem('gc_saved_jobs', JSON.stringify(next));
  };

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(searchQuery) ||
      Boolean(filters.workplaceType) ||
      filters.employmentTypes.length > 0 ||
      filters.experienceLevels.length > 0 ||
      Boolean(filters.location)
    );
  }, [searchQuery, filters]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16">
      {/* ── Top Hero Banner ── */}
      <section className="bg-gradient-to-b from-[#1A1A2E] to-[#2D2D44] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <Sparkles size={13} /> The Golden Circle Career Portal
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Build the Future at High-Growth Startups
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-300 mb-8">
            Explore verified software engineering, product, AI, and design roles directly with founding teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/jobs/new">
              <Button variant="primary" size="md" className="gap-2 shadow-lg">
                <PlusCircle size={16} /> Post a Job Opening
              </Button>
            </Link>
            <Link to="/jobs/manage">
              <Button variant="secondary" size="md" className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
                Recruiter Hub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Search & Filter Controls ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by job title, core skill (React, Python, Go), or company name..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <span className="hidden sm:inline text-neutral-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="newest">Latest Posted</option>
                <option value="views">Most Viewed</option>
                <option value="title_asc">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 2-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20">
              <JobFilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </div>

          {/* Right Column: Jobs Listing */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-neutral-500">Searching active opportunities...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center max-w-lg mx-auto shadow-xs my-8">
                <Briefcase className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Open Roles Found</h3>
                <p className="text-xs sm:text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
                  Try adjusting your keywords, switching workplace flexibility, or clearing filters.
                </p>
                {hasActiveFilters && (
                  <Button variant="primary" size="sm" onClick={handleResetFilters} className="mx-auto text-xs">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {jobs.map((job) => {
                    const jobId = job._id || job.id;
                    const isSaved = savedJobIds.includes(jobId);

                    return (
                      <JobCard
                        key={jobId}
                        job={job}
                        isSaved={isSaved}
                        onToggleSave={handleToggleSave}
                      />
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>

                    <span className="text-xs text-neutral-500 font-medium">
                      Page <strong className="text-gray-900">{currentPage}</strong> of{' '}
                      <strong className="text-gray-900">{pagination.totalPages}</strong>
                    </span>

                    <button
                      disabled={currentPage >= pagination.totalPages}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
