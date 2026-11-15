import { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Send } from 'lucide-react';
import Button from './Button';

export default function ShareModal({ isOpen, onClose, companyName, shareUrl }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const url = shareUrl || window.location.href;
  const title = `Check out ${companyName || 'this startup'} on The Golden Circle`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOptions = [
    {
      name: 'X (Twitter)',
      color: 'bg-black text-white hover:bg-neutral-800',
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      color: 'bg-[#0077b5] text-white hover:bg-[#006097]',
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366] text-white hover:bg-[#1EBE5D]',
      link: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}: ${url}`)}`,
    },
    {
      name: 'Email',
      color: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200',
      link: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Take a look at this company: ${url}`)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Share2 className="text-amber-500" size={18} />
          Share Company Profile
        </h3>
        <p className="text-xs text-neutral-500 mb-5">
          Spread the word about {companyName || 'this startup'} across your network.
        </p>

        {/* Copy link bar */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200 mb-6">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-transparent text-xs text-neutral-700 px-2 outline-none truncate font-mono"
          />
          <Button
            variant={copied ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs py-1.5 px-3 flex-shrink-0"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-600" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Link
              </>
            )}
          </Button>
        </div>

        {/* Quick share buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          {shareOptions.map((opt) => (
            <a
              key={opt.name}
              href={opt.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${opt.color}`}
            >
              <span>{opt.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
