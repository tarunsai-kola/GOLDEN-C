import { RotateCcw, Filter, Check, Briefcase, ShieldCheck, MapPin } from 'lucide-react';

export default function DiscoveryFilterSidebar({
  filters,
  filterMeta,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
}) {
  const industries = filterMeta?.industries || [
    { name: 'AI & Machine Learning', count: 42 },
    { name: 'SaaS', count: 38 },
    { name: 'Fintech', count: 29 },
    { name: 'Healthtech', count: 18 },
    { name: 'CleanTech & Energy', count: 15 },
    { name: 'Edtech', count: 12 },
    { name: 'Cybersecurity', count: 11 },
    { name: 'Web3 & Crypto', count: 9 },
    { name: 'E-commerce & Retail', count: 8 },
  ];

  const stages = [
    { label: 'Idea', value: 'Idea' },
    { label: 'Seed', value: 'Seed' },
    { label: 'Early Stage', value: 'Early Stage' },
    { label: 'Growth', value: 'Growth' },
    { label: 'Scaleup', value: 'Scaleup' },
  ];

  const teamSizes = ['1-10', '11-50', '51-200', '201+'];

  const handleIndustryToggle = (indName) => {
    const current = filters.industries || [];
    const next = current.includes(indName)
      ? current.filter((i) => i !== indName)
      : [...current, indName];
    onFilterChange('industries', next);
  };

  const handleStageToggle = (stgVal) => {
    const current = filters.stages || [];
    const next = current.includes(stgVal)
      ? current.filter((s) => s !== stgVal)
      : [...current, stgVal];
    onFilterChange('stages', next);
  };

  const handleTeamSizeToggle = (size) => {
    onFilterChange('teamSize', filters.teamSize === size ? '' : size);
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm space-y-6">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <Filter size={16} className="text-amber-500" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 transition cursor-pointer"
          >
            <RotateCcw size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Quick Toggles: Hiring & Verified */}
      <div className="space-y-3 pb-4 border-b border-neutral-100">
        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-neutral-50 transition">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-neutral-800">Hiring Now</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.isHiring)}
            onChange={(e) => onFilterChange('isHiring', e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-neutral-50 transition">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-neutral-800">Verified Only</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.isVerified)}
            onChange={(e) => onFilterChange('isVerified', e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
          />
        </label>
      </div>

      {/* Stage Pills */}
      <div className="space-y-3 pb-4 border-b border-neutral-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Startup Stage</h4>
        <div className="flex flex-wrap gap-1.5">
          {stages.map((stg) => {
            const isSelected = (filters.stages || []).includes(stg.value);
            return (
              <button
                key={stg.value}
                onClick={() => handleStageToggle(stg.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {stg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Industries Checklist */}
      <div className="space-y-3 pb-4 border-b border-neutral-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Industry / Sector</h4>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {industries.map((ind) => {
            const isChecked = (filters.industries || []).includes(ind.name);
            return (
              <label
                key={ind.name}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 transition cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleIndustryToggle(ind.name)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className={isChecked ? 'font-semibold text-gray-900' : 'text-neutral-600'}>
                    {ind.name}
                  </span>
                </div>
                {ind.count !== undefined && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {ind.count}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Location Filter */}
      <div className="space-y-2 pb-4 border-b border-neutral-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Location</h4>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={filters.location || ''}
            onChange={(e) => onFilterChange('location', e.target.value)}
            placeholder="City, State, or Country"
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Team Size Pills */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Team Size</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {teamSizes.map((size) => {
            const isSelected = filters.teamSize === size;
            return (
              <button
                key={size}
                onClick={() => handleTeamSizeToggle(size)}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {size} members
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
