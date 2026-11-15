export default function StartupCardSkeleton() {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden shadow-xs animate-pulse">
      {/* Cover skeleton */}
      <div className="h-28 sm:h-32 bg-neutral-200" />

      {/* Body */}
      <div className="px-5 pb-4">
        {/* Overlapping Logo skeleton */}
        <div className="-mt-8 mb-3 flex items-end justify-between">
          <div className="h-14 w-14 rounded-2xl bg-neutral-300 border-2 border-white" />
          <div className="h-6 w-14 rounded-full bg-neutral-200" />
        </div>

        {/* Title & Tagline skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 w-3/4 rounded bg-neutral-200" />
          <div className="h-3 w-full rounded bg-neutral-100" />
          <div className="h-3 w-5/6 rounded bg-neutral-100" />
        </div>

        {/* Tags skeleton */}
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <div className="h-5 w-16 rounded bg-neutral-200" />
          <div className="h-5 w-20 rounded bg-neutral-100" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
        <div className="h-3 w-12 rounded bg-neutral-200" />
        <div className="h-3 w-16 rounded bg-neutral-200" />
      </div>
    </div>
  );
}
