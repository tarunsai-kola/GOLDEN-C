import { useState } from 'react';
import { X, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import Button from './Button';

export default function ContactModal({ isOpen, onClose, companyName, contactInfo = {}, website }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  if (!isOpen) return null;

  const email = contactInfo?.email || 'contact@thegoldencircle.io';
  const phone = contactInfo?.phone || null;
  const address = contactInfo?.address || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate inquiry submission
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
        >
          <X size={18} />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Mail className="text-amber-500" size={20} />
          Contact {companyName || 'Company'}
        </h3>
        <p className="text-xs text-neutral-500 mb-6">
          Reach out for business partnerships, press inquiries, or talent collaborations.
        </p>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4 text-green-600">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">Inquiry Transmitted!</h4>
            <p className="text-xs text-neutral-600 mb-6 max-w-xs mx-auto">
              Your message was delivered to the {companyName} team. A representative will get in touch shortly.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSent(false);
                onClose();
              }}
              className="w-full justify-center"
            >
              Close Window
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick contact channels */}
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-neutral-700">
                <Mail size={14} className="text-amber-600" />
                <a href={`mailto:${email}`} className="font-semibold text-amber-800 hover:underline">
                  {email}
                </a>
              </div>
              {phone && (
                <div className="flex items-center gap-2.5 text-neutral-700">
                  <Phone size={14} className="text-amber-600" />
                  <span>{phone}</span>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-2.5 text-neutral-700">
                  <MapPin size={14} className="text-amber-600" />
                  <span>{address}</span>
                </div>
              )}
            </div>

            {/* Direct inquiry form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Your Work Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Partnership, recruitment, or general query"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Share details of your inquiry..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={loading} className="gap-1.5">
                  <Send size={13} /> Send Inquiry
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
