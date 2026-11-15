import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Building2,
  X,
  PlusCircle,
} from 'lucide-react';
import discoveryService from '../../services/discovery.service';
import { useAuth } from '../../context/AuthContext';
import DiscoverySearchBar from '../../components/discovery/DiscoverySearchBar';
import DiscoveryFilterSidebar from '../../components/discovery/DiscoveryFilterSidebar';
import MobileFilterDrawer from '../../components/discovery/MobileFilterDrawer';
import StartupCard from '../../components/discovery/StartupCard';
import StartupCardSkeleton from '../../components/discovery/StartupCardSkeleton';
import EmptyDiscoveryState from '../../components/discovery/EmptyDiscoveryState';
import Button from '../../components/ui/Button';

export default function StartupDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    industries: searchParams.get('industry') ? searchParams.get('industry').split(',') : [],
    stages: searchParams.get('stage') ? searchParams.get('stage').split(',') : [],
    location: searchParams.get('location') || '',
    teamSize: searchParams.get('teamSize') || '',
    isHiring: searchParams.get('isHiring') === 'true',
    isVerified: searchParams.get('isVerified') === 'true',
  });

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Data state
  const [startups, setStartups] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [filterMeta, setFilterMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Saved / Followed local cache for instant UI feedback
  const [savedOrgIds, setSavedOrgIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gc_saved_startups') || '[]');
    } catch {
      return [];
    }
  });

  // Fetch filter metadata on mount
  useEffect(() => {
    discoveryService.getFilterMeta().then((meta) => setFilterMeta(meta));
  }, []);

  // Fetch startups whenever query, filters, sort, or page changes
  const fetchStartups = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: searchQuery.trim() || undefined,
        industry: filters.industries.length > 0 ? filters.industries.join(',') : undefined,
        stage: filters.stages.length > 0 ? filters.stages.join(',') : undefined,
        location: filters.location.trim() || undefined,
        teamSize: filters.teamSize || undefined,
        isHiring: filters.isHiring ? true : undefined,
        isVerified: filters.isVerified ? true : undefined,
        sort: sortBy,
        page: currentPage,
        limit: 12,
      };

      const res = await discoveryService.getStartups(params);
      const list = res.data || res.startups || (Array.isArray(res) ? res : []);
      setStartups(list);

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
      console.error('Failed to load discovery startups:', err);
      setStartups([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy, currentPage]);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

  // Handle filter changes
  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      industries: [],
      stages: [],
      location: '',
      teamSize: '',
      isHiring: false,
      isVerified: false,
    });
    setCurrentPage(1);
  };

  // Trending tag click
  const handleTagClick = (tag) => {
    if (tag === 'Hiring Now') {
      handleFilterChange('isHiring', true);
    } else if (tag.includes('Stage')) {
      const clean = tag.replace(' Stage', '');
      handleFilterChange('stages', [clean]);
    } else if (tag === 'Bangalore') {
      handleFilterChange('location', 'Bangalore');
    } else {
      handleFilterChange('industries', [tag]);
    }
  };

  // Bookmark toggle
  const handleToggleSave = async (orgId, willSave) => {
    let next;
    if (willSave) {
      next = [...savedOrgIds, orgId];
      await discoveryService.saveStartup(orgId);
    } else {
      next = savedOrgIds.filter((id) => id !== orgId);
      await discoveryService.unsaveStartup(orgId);
    }
    setSavedOrgIds(next);
    localStorage.setItem('gc_saved_startups', JSON.stringify(next));
  };

  // Check if any active filters
  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(searchQuery) ||
      filters.industries.length > 0 ||
      filters.stages.length > 0 ||
      Boolean(filters.location) ||
      Boolean(filters.teamSize) ||
      filters.isHiring ||
      filters.isVerified
    );
  }, [searchQuery, filters]);

  // Active filter badge count for mobile
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    count += filters.industries.length;
    count += filters.stages.length;
    if (filters.location) count++;
    if (filters.teamSize) count++;
    if (filters.isHiring) count++;
    if (filters.isVerified) count++;
    return count;
  }, [searchQuery, filters]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16">
      {/* ── Hero Banner ── */}
      <section className="bg-gradient-to-b from-[#1A1A2E] to-[#2D2D44] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <Sparkles size={13} /> The Golden Circle Discovery Engine
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Discover High-Growth Startups
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-300 mb-8">
            Explore curated ventures, verified founders, and groundbreaking tech companies building the future.
          </p>

          {/* Search Bar Container */}
          <div className="max-w-3xl mx-auto">
            <DiscoverySearchBar
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
              onTagClick={handleTagClick}
            />
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Active Filters Bar & Controls */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mr-1">
              {loading ? 'Searching...' : `${pagination.total} Startups Found`}
            </span>

            {/* Active filter chips */}
            {filters.industries.map((ind) => (
              <span
                key={ind}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200"
              >
                {ind}
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-600"
                  onClick={() =>
                    handleFilterChange(
                      'industries',
                      filters.industries.filter((i) => i !== ind)
                    )
                  }
                />
              </span>
            ))}

            {filters.stages.map((stg) => (
              <span
                key={stg}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200"
              >
                {stg}
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-600"
                  onClick={() =>
                    handleFilterChange(
                      'stages',
                      filters.stages.filter((s) => s !== stg)
                    )
                  }
                />
              </span>
            ))}

            {filters.isHiring && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200">
                Hiring Now
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-600"
                  onClick={() => handleFilterChange('isHiring', false)}
                />
              </span>
            )}

            {filters.isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
                Verified Only
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-600"
                  onClick={() => handleFilterChange('isVerified', false)}
                />
              </span>
            )}

            {filters.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
                {filters.location}
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-600"
                  onClick={() => handleFilterChange('location', '')}
                />
              </span>
            )}

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-700 ml-1 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Right Controls: Sort Dropdown & Mobile Filter Button */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-amber-500" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="h-4 w-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="newest">Recently Joined</option>
                <option value="popularity">Most Popular</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="founded_desc">Founded Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 2-Column Responsive Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20">
              <DiscoveryFilterSidebar
                filters={filters}
                filterMeta={filterMeta}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </div>

          {/* Right Column: Startups Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <StartupCardSkeleton key={idx} />
                ))}
              </div>
            ) : startups.length === 0 ? (
              <EmptyDiscoveryState
                onReset={handleResetFilters}
                hasFilters={hasActiveFilters}
              />
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {startups.map((startup) => {
                    const org = startup.organization || startup;
                    const orgId = org._id || org.id || startup._id || startup.id;
                    const isSaved = savedOrgIds.includes(orgId);

                    return (
                      <StartupCard
                        key={orgId}
                        startup={startup}
                        isSaved={isSaved}
                        isFollowed={Boolean(startup.isFollowed)}
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

      {/* ── Mobile Filter Drawer ── */}
      <MobileFilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filters={filters}
        filterMeta={filterMeta}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalResults={pagination.total}
      />
    </div>
  );
}
