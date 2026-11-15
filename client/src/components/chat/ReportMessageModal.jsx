import { useState } from 'react';
import { AlertCircle, Flag, X } from 'lucide-react';
import Button from '../ui/Button';

export default function ReportMessageModal({
  isOpen,
  onClose,
  onSubmit,
  messageContent = '',
}) {
  const [reason, setReason] = useState('Harassment or Abusive Behavior');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ reason, details });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Flag className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-charcoal text-base">Report Inappropriate Message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-charcoal hover:bg-neutral-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {messageContent && (
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs text-neutral-600 italic">
              "{messageContent}"
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Harassment or Abusive Behavior">Harassment or Abusive Behavior</option>
              <option value="Spam or Commercial Promotion">Spam or Commercial Promotion</option>
              <option value="Scam, Fraud or Impersonation">Scam, Fraud or Impersonation</option>
              <option value="Hate Speech or Intimidation">Hate Speech or Intimidation</option>
              <option value="Other Safety Violation">Other Safety Violation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5">
              Additional Details (optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide context for the Trust & Safety team..."
              className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-neutral-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" loading={loading} className="gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
