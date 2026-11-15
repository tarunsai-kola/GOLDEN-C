import { RotateCcw, Filter, Briefcase, MapPin, Laptop } from 'lucide-react';

export default function JobFilterSidebar({
  filters,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
}) {
  const workplaceTypes = [
    { label: 'All', value: '' },
    { label: 'Remote', value: 'Remote' },
    { label: 'Hybrid', value: 'Hybrid' },
    { label: 'On-site', value: 'On-site' },
  ];

  const employmentTypes = [
    'Full-time',
    'Internship',
    'Co-founder',
    'Part-time',
    'Contract',
  ];

  const experienceLevels = [
    'Internship / Student',
    'Entry-level (0-2 yrs)',
    'Mid-level (2-5 yrs)',
    'Senior (5-8 yrs)',
    'Lead / Executive (8+ yrs)',
  ];

  const handleEmploymentToggle = (type) => {
    const current = filters.employmentTypes || [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFilterChange('employmentTypes', next);
  };

  const handleExperienceToggle = (lvl) => {
    const current = filters.experienceLevels || [];
    const next = current.includes(lvl)
      ? current.filter((l) => l !== lvl)
      : [...current, lvl];
    onFilterChange('experienceLevels', next);
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm space-y-6">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <Filter size={16} className="text-amber-500" />
          <span>Job Filters</span>
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

      {/* Workplace Type Selector */}
      <div className="space-y-3 pb-4 border-b border-neutral-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Workplace Flexibility</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {workplaceTypes.map((wp) => {
            const isSelected = (filters.workplaceType || '') === wp.value;
            return (
              <button
                key={wp.label}
                onClick={() => onFilterChange('workplaceType', wp.value)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {wp.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Employment Types Checklist */}
      <div className="space-y-3 pb-4 border-b border-neutral-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Employment Type</h4>
        <div className="space-y-1.5">
          {employmentTypes.map((type) => {
            const isChecked = (filters.employmentTypes || []).includes(type);
            return (
              <label
                key={type}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 transition cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleEmploymentToggle(type)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className={isChecked ? 'font-semibold text-gray-900' : 'text-neutral-600'}>
                    {type}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Experience Levels Checklist */}
      <div className="space-y-3 pb-4 border-b border-neutral-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Experience Level</h4>
        <div className="space-y-1.5">
          {experienceLevels.map((lvl) => {
            const isChecked = (filters.experienceLevels || []).includes(lvl);
            return (
              <label
                key={lvl}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 transition cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleExperienceToggle(lvl)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className={isChecked ? 'font-semibold text-gray-900' : 'text-neutral-600'}>
                    {lvl}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Location</h4>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={filters.location || ''}
            onChange={(e) => onFilterChange('location', e.target.value)}
            placeholder="e.g. Bangalore, Mumbai, Remote"
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>
    </div>
  );
}
