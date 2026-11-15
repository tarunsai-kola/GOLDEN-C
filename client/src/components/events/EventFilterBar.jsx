import { Crown, Video, MapPin, Globe, Sparkles, Filter } from 'lucide-react';

export default function EventFilterBar({
  filters,
  onFilterChange,
  categories = [
    'All Categories',
    'Masterclass',
    'Demo Day',
    'Hackathon',
    'Pitch Session',
    'Networking',
    'Workshop',
    'Panel',
    'AMA',
  ],
}) {
  const formats = [
    { label: 'All Formats', value: 'all' },
    { label: 'Online', value: 'Online', icon: Video },
    { label: 'In-Person', value: 'Offline', icon: MapPin },
    { label: 'Hybrid', value: 'Hybrid', icon: Globe },
  ];

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-4">
      {/* Top Row: Format Tabs & Quick Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100">
        {/* Format Selector */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = (filters.format || 'all') === fmt.value;
            return (
              <button
                key={fmt.value}
                onClick={() => onFilterChange('format', fmt.value === 'all' ? '' : fmt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {Icon && <Icon size={12} />}
                <span>{fmt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Toggles: Official GC & Free Only */}
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-1.5 font-semibold text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(filters.officialOnly)}
              onChange={(e) => onFilterChange('officialOnly', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
            />
            <Crown size={13} className="text-amber-500 fill-amber-500" />
            <span>Golden Circle Official</span>
          </label>

          <label className="flex items-center gap-1.5 font-semibold text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.pricingType === 'Free'}
              onChange={(e) => onFilterChange('pricingType', e.target.checked ? 'Free' : '')}
              className="h-3.5 w-3.5 rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
            />
            <span>Free RSVP Only</span>
          </label>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {categories.map((cat) => {
          const isSelected =
            cat === 'All Categories'
              ? !filters.category || filters.category === 'all'
              : filters.category === cat;

          return (
            <button
              key={cat}
              onClick={() =>
                onFilterChange('category', cat === 'All Categories' ? '' : cat)
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
