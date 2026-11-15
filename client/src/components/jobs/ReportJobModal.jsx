import { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';

export default function ReportJobModal({ isOpen, onClose, jobId, jobTitle, onReport }) {
  const [reason, setReason] = useState('Misleading role or salary');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    'Misleading role or salary',
    'Expired / Broken application link',
    'Spam / Scam / Phishing',
    'Discriminatory or offensive content',
    'Charging candidate fees',
    'Other reason',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onReport) {
        await onReport(jobId, { reason, details });
      }
      setSubmitted(true);
    } catch (err) {
      alert(err.message || 'Failed to submit report');
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
            <h4 className="text-lg font-bold text-gray-900 mb-1">Report Received</h4>
            <p className="text-xs text-neutral-600 mb-6">
              Our moderation team reviews flagged listings within 24 hours to ensure community integrity.
            </p>
            <Button variant="primary" size="sm" onClick={onClose} className="w-full justify-center">
              Close
            </Button>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Report Job Listing</h3>
            <p className="text-xs text-neutral-500 mb-5 truncate">{jobTitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Reason for Report *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide context or links that help our moderators investigate..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="sm" loading={submitting} className="gap-1.5">
                  <Send size={13} /> Submit Report
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
