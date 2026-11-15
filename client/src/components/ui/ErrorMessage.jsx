import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <div className="p-3 bg-red-50 rounded-full">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm text-neutral-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          Try again
        </button>
      )}
    </div>
  );
}
