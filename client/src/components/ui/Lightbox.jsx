import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

export default function Lightbox({ images = [], activeIndex = 0, isOpen = false, onClose, onIndexChange }) {
  const currentImage = images[activeIndex];

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && activeIndex > 0) onIndexChange(activeIndex - 1);
      if (e.key === 'ArrowRight' && activeIndex < images.length - 1) onIndexChange(activeIndex + 1);
    },
    [isOpen, activeIndex, images.length, onClose, onIndexChange]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity">
      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10 px-2">
        <div className="flex items-center gap-2">
          {currentImage.category && (
            <span className="text-xs uppercase font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
              {currentImage.category}
            </span>
          )}
          <span className="text-xs text-neutral-400">
            {activeIndex + 1} of {images.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          aria-label="Close viewer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Prev button */}
      {activeIndex > 0 && (
        <button
          onClick={() => onIndexChange(activeIndex - 1)}
          className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition z-10 hidden sm:flex items-center justify-center cursor-pointer"
          aria-label="Previous photo"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Main Image Container */}
      <div className="max-w-5xl max-h-[85vh] p-4 flex flex-col items-center justify-center">
        <img
          src={currentImage.url}
          alt={currentImage.caption || 'Company gallery photo'}
          className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl transition"
        />
        {currentImage.caption && (
          <p className="mt-3 text-center text-sm font-medium text-neutral-200 max-w-xl">
            {currentImage.caption}
          </p>
        )}
      </div>

      {/* Next button */}
      {activeIndex < images.length - 1 && (
        <button
          onClick={() => onIndexChange(activeIndex + 1)}
          className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition z-10 hidden sm:flex items-center justify-center cursor-pointer"
          aria-label="Next photo"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}
