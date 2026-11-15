import { useState, useEffect } from 'react';
import { Search, X, Sparkles, TrendingUp } from 'lucide-react';

export default function DiscoverySearchBar({ value, onChange, onTagClick }) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const popularTags = [
    'AI & Machine Learning',
    'Fintech',
    'SaaS',
    'Seed Stage',
    'Hiring Now',
    'Bangalore',
    'CleanTech',
  ];

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <div className="w-full space-y-3">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
          <Search className="h-5 w-5 text-amber-500" />
        </div>

        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder="Search startups by name, mission, problem solved, or products..."
          className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl border border-neutral-200 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-sm transition placeholder:text-neutral-400"
        />

        {localValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Quick Search Tag Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        <div className="flex items-center gap-1 text-xs text-neutral-400 pl-1 pr-1 font-medium whitespace-nowrap">
          <TrendingUp size={12} className="text-amber-500" />
          <span>Trending:</span>
        </div>
        {popularTags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-neutral-200 text-neutral-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50 transition whitespace-nowrap shadow-2xs cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
