import Spinner from '../ui/Spinner';

export default function PageLoader() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-neutral-50/50">
      <img
        src="/logo.png"
        alt="The Golden Circle"
        className="h-14 w-14 rounded-full object-cover shadow-md border border-amber-400/50 animate-pulse"
      />
      <Spinner size="md" />
      <span className="text-xs text-neutral-500 font-medium tracking-wide text-center px-4">
        The Golden Circle — Discovering the people, ideas and businesses building tomorrow.
      </span>
    </div>
  );
}
