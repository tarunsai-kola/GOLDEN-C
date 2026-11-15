import Spinner from '../ui/Spinner';

export default function PageLoader() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-neutral-50/50">
      <div
        className="h-10 w-10 rounded-full border-2 flex items-center justify-center text-xs font-bold animate-pulse"
        style={{ borderColor: '#C9A84C', color: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.08)' }}
      >
        GC
      </div>
      <Spinner size="md" />
      <span className="text-xs text-neutral-400 font-medium tracking-wide">
        Loading Golden Circle Platform...
      </span>
    </div>
  );
}
