import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function ProfileCompletionCard({ user }) {
  const steps = [
    { key: 'avatar', label: 'Upload executive profile picture', completed: Boolean(user?.avatar) },
    { key: 'headline', label: 'Add professional headline or role', completed: Boolean(user?.headline || user?.title) },
    { key: 'bio', label: 'Write founder / operator bio', completed: Boolean(user?.bio) },
    { key: 'location', label: 'Set your primary hub or city', completed: Boolean(user?.location) },
    { key: 'organization', label: 'Link or register your venture', completed: Boolean(user?.organization || user?.company) },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  if (percentage === 100) {
    return (
      <Card padding="md" className="bg-gradient-to-r from-amber-50/70 to-yellow-50/50 border-amber-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-charcoal text-sm">Executive Profile 100% Complete</h4>
              <p className="text-xs text-neutral-600">Your profile is fully verified across the syndicate network.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-800 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200">
              All Star Founder
            </span>
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-amber-900 hover:bg-amber-100/60">
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md" className="border-neutral-200/90 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Profile Strength
            </span>
          </div>
          <h4 className="font-bold text-charcoal text-base">
            Complete your Executive Profile ({percentage}%)
          </h4>
          <p className="text-xs text-neutral-500 mt-0.5">
            Profiles with complete information receive 4x more syndicate invitations and job matches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full border-4 border-amber-100 flex items-center justify-center font-bold text-sm text-charcoal relative">
            <svg className="w-full h-full -rotate-90 absolute top-0 left-0" viewBox="0 0 36 36">
              <path
                className="text-amber-500"
                strokeWidth="3.5"
                strokeDasharray={`${percentage}, 100`}
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span>{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Progress checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-neutral-100">
        {steps.map((step) => (
          <div
            key={step.key}
            className={`flex items-center gap-2.5 p-2 rounded-xl text-xs ${
              step.completed ? 'text-neutral-500 bg-neutral-50/50' : 'text-charcoal font-medium bg-amber-50/40'
            }`}
          >
            {step.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
            <span className="truncate">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Keep your details fresh to attract founders</span>
        <Link to="/profile">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold text-amber-800 border-amber-300 hover:bg-amber-50">
            Edit Profile
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
