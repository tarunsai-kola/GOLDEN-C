import { Search, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

export default function EmptyDiscoveryState({ onReset, hasFilters = false }) {
  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center max-w-lg mx-auto shadow-xs my-8">
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
        <Search size={28} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">No Startups Found</h3>
      <p className="text-xs sm:text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
        We couldn't find any startups matching your active filters or search keywords. Try adjusting your query.
      </p>

      {hasFilters && (
        <Button
          variant="primary"
          size="sm"
          onClick={onReset}
          className="gap-1.5 mx-auto text-xs"
        >
          <RotateCcw size={14} /> Clear all filters
        </Button>
      )}
    </div>
  );
}
