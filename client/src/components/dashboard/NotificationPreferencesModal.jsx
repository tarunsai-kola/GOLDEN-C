import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import notificationService from '../../services/notification.service';
import Button from '../ui/Button';

export default function NotificationPreferencesModal({
  isOpen,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    connectionRequests: true,
    messages: true,
    eventReminders: true,
    companyUpdates: true,
    jobAlerts: true,
  });

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        setLoading(true);
        try {
          const res = await notificationService.getPreferences();
          if (res) setPrefs(res);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationService.updatePreferences(prefs);
      alert('Notification preferences updated successfully!');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const preferenceItems = [
    {
      key: 'emailNotifications',
      label: 'Global Email Notifications',
      description: 'Receive executive briefings and critical updates via email.',
    },
    {
      key: 'connectionRequests',
      label: 'Syndicate Connection Invitations',
      description: 'Notify me when another founder or investor invites me to connect.',
    },
    {
      key: 'messages',
      label: 'Direct Messaging Alerts',
      description: 'Notify me of new direct messages from verified connections.',
    },
    {
      key: 'eventReminders',
      label: 'Event Schedules & Livestreams',
      description: 'Receive reminders 24h and 1h prior to registered webinars.',
    },
    {
      key: 'companyUpdates',
      label: 'Followed Company Announcements',
      description: 'Alert me when followed startups publish new milestones or press.',
    },
    {
      key: 'jobAlerts',
      label: 'Career & Talent Opportunities',
      description: 'Notify me of new roles matching my saved profile skills.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-charcoal text-base">Notification Preferences</h3>
              <p className="text-xs text-neutral-500">Manage communication channels and frequency.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-charcoal hover:bg-neutral-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
          {preferenceItems.map((item) => {
            const isChecked = Boolean(prefs[item.key]);

            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                className="flex items-start justify-between gap-4 p-3 rounded-2xl hover:bg-neutral-50 cursor-pointer transition border border-transparent hover:border-neutral-200/80"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-charcoal">{item.label}</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div
                  className={`w-11 h-6 rounded-full p-1 transition-colors relative flex-shrink-0 ${
                    isChecked ? 'bg-amber-600' : 'bg-neutral-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                      isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
