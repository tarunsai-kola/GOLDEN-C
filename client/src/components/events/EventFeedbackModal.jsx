import { useState } from 'react';
import { X, Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';

export default function EventFeedbackModal({ isOpen, onClose, eventId, eventTitle, onSubmitFeedback }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onSubmitFeedback) {
        await onSubmitFeedback(eventId, { rating, comment });
      }
      setSubmitted(true);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4 text-green-600">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">Feedback Submitted!</h4>
            <p className="text-xs text-neutral-600 mb-6">
              Thank you for helping us elevate the quality of Golden Circle ecosystem events.
            </p>
            <Button variant="primary" size="sm" onClick={onClose} className="w-full justify-center">
              Close
            </Button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" size={18} />
              Session Feedback & Review
            </h3>
            <p className="text-xs text-neutral-500 mb-5 truncate">{eventTitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  How would you rate this event?
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition"
                    >
                      <Star
                        size={24}
                        className={
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-300'
                        }
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-700 ml-2">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Text comment */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Key Takeaways or Suggestions
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What was most valuable about this talk or workshop? How can organizers improve?"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={submitting} className="gap-1.5">
                  <Send size={13} /> Submit Review
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
