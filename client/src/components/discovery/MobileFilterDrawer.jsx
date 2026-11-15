import { X, Filter, RotateCcw, Check } from 'lucide-react';
import DiscoveryFilterSidebar from './DiscoveryFilterSidebar';
import Button from '../ui/Button';

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  filterMeta,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  totalResults = 0,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
            <Filter size={18} className="text-amber-500" />
            <span>Filter Startups</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <DiscoveryFilterSidebar
            filters={filters}
            filterMeta={filterMeta}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs text-neutral-600"
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="flex-1 justify-center gap-2 text-xs font-semibold py-2.5"
          >
            <Check size={16} /> Show {totalResults} Results
          </Button>
        </div>
      </div>
    </div>
  );
}
