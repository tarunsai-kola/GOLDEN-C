import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Briefcase,
  MapPin,
  Globe,
  Clock,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Save,
  ShieldAlert,
  ChevronDown,
  ArrowLeft,
  X,
  Layers,
} from 'lucide-react';

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function GitHubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '../data/regionsData';

// Constants for profile options
const WORK_OPTIONS = [
  'Engineering',
  'Product',
  'Design',
  'Sales & marketing',
  'Operations',
];

const FIELD_OPTIONS = [
  'Technology',
  'Finance',
  'Research',
  'Community',
  'Artist',
  'Sports',
  'Music',
];

const TIME_COMMITMENT_OPTIONS = [
  {
    id: 'Full time',
    title: 'Full time',
    description: '40+ hours a week, or ready to be',
  },
  {
    id: 'Part time',
    title: 'Part time',
    description: '20–40 hours a week alongside something else',
  },
  {
    id: 'Exploring',
    title: 'Exploring',
    description: 'Evenings and weekends for now',
  },
];

const LOOKING_FOR_OPTIONS = [
  {
    id: 'A co-founder for my idea',
    title: 'A co-founder for my idea',
    description: 'You are building; you need someone beside you',
  },
  {
    id: 'An idea to join',
    title: 'An idea to join',
    description: 'You want to build, not to come up with it',
  },
  {
    id: 'Either',
    title: 'Either',
    description: 'Open to both sides',
  },
];

export default function Profile() {
  const { user, updateProfile, deactivateAccount } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [intro, setIntro] = useState('');
  const [workCovers, setWorkCovers] = useState([]);
  const [fields, setFields] = useState([]);
  const [timeCommitment, setTimeCommitment] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [state, setState] = useState('Not saying');
  const [district, setDistrict] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  // UI states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Sync state from current user data
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setHeadline(user.headline || '');
      setIntro(user.intro || user.bio || '');
      setWorkCovers(Array.isArray(user.workCovers) ? user.workCovers : []);
      setFields(Array.isArray(user.fields) ? user.fields : []);
      setTimeCommitment(user.timeCommitment || '');
      setLookingFor(user.lookingFor || '');
      setState(user.state || 'Not saying');
      setDistrict(user.district || '');
      setWebsite(user.website || '');
      setLinkedin(user.linkedin || '');
      setGithub(user.github || '');
    }
  }, [user]);

  // Handle work toggle
  const toggleWork = (item) => {
    setWorkCovers((prev) =>
      prev.includes(item) ? prev.filter((w) => w !== item) : [...prev, item]
    );
  };

  // Handle field toggle
  const toggleField = (item) => {
    setFields((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  };

  // When state changes, reset district if it is not valid for new state
  const handleStateChange = (newState) => {
    setState(newState);
    const validDistricts = DISTRICTS_BY_STATE[newState] || [];
    if (!validDistricts.includes(district)) {
      setDistrict('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
        fullName: fullName.trim(),
        headline: headline.trim(),
        intro: intro.trim(),
        workCovers,
        fields,
        timeCommitment,
        lookingFor,
        state,
        district,
        website: website.trim(),
        linkedin: linkedin.trim(),
        github: github.trim(),
      });

      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateAccount();
      navigate('/login', {
        state: {
          notice: 'Your account has been deactivated. You can sign back in anytime to reactivate it.',
        },
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to deactivate account. Please contact support.');
      setShowDeactivateModal(false);
    } finally {
      setDeactivating(false);
    }
  };

  const availableDistricts = DISTRICTS_BY_STATE[state] || [];

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20 pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-500 hover:text-amber-800 transition"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
            Public Founder Profile
          </span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Your profile
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">
            This is what a founder reads before deciding whether to reach out. Nobody commits years of
            their life to a name and a district, so the more of this you fill in, the more likely it is
            that somebody starts a conversation.
          </p>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">Profile saved successfully</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your updated details are now live across the network and discovery directory.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Main Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Who you are */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Who you are</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Shown on every idea you post and in the directory.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
              />
            </div>

            {/* Headline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Headline
                </label>
                <span
                  className={`text-xs font-mono ${
                    headline.length > 85 ? 'text-amber-600 font-bold' : 'text-neutral-400'
                  }`}
                >
                  {headline.length}/90
                </span>
              </div>
              <input
                type="text"
                maxLength={90}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Backend engineer, 8 years, last at a logistics startup"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
              />
              <p className="text-xs text-neutral-500 mt-1.5">
                One line. This is what people read before anything else.
              </p>
            </div>

            {/* Intro — optional */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Intro — optional
                </label>
                <span
                  className={`text-xs font-mono ${
                    intro.length > 570 ? 'text-amber-600 font-bold' : 'text-neutral-400'
                  }`}
                >
                  {intro.length}/600
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={600}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="What you have built, what you are good at, and what you want to build next."
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition leading-relaxed resize-y"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Leave it empty rather than writing filler.
              </p>
            </div>
          </div>

          {/* SECTION 2: What you do */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">What you do</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                The first thing anyone filters on — the half of the work you take on, and the field you work in.
              </p>
            </div>

            {/* What you cover */}
            <div className="space-y-4 pt-2 border-t border-neutral-100">
              <h3 className="text-sm font-bold text-gray-900">What you cover</h3>

              {/* The work */}
              <div>
                <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                  The work
                </span>
                <div className="flex flex-wrap gap-2">
                  {WORK_OPTIONS.map((item) => {
                    const selected = workCovers.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleWork(item)}
                        className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                          selected
                            ? 'bg-amber-600 text-white shadow-xs scale-[1.02]'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* The field */}
              <div>
                <span className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                  The field
                </span>
                <div className="flex flex-wrap gap-2">
                  {FIELD_OPTIONS.map((item) => {
                    const selected = fields.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleField(item)}
                        className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                          selected
                            ? 'bg-amber-600 text-white shadow-xs scale-[1.02]'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Pick as many as genuinely apply.
                </p>
              </div>
            </div>

            {/* Time you have */}
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Time you have</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIME_COMMITMENT_OPTIONS.map((opt) => {
                  const active = timeCommitment === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTimeCommitment(opt.id)}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        active
                          ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-600'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">{opt.title}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            active
                              ? 'border-amber-600 bg-amber-600'
                              : 'border-neutral-300'
                          }`}
                        >
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-600 leading-snug">{opt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: What you are here for */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">What you are here for</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                So people looking for the other half of the market can find you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {LOOKING_FOR_OPTIONS.map((opt) => {
                const active = lookingFor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLookingFor(opt.id)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      active
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-600'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900">{opt.title}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          active
                            ? 'border-amber-600 bg-amber-600'
                            : 'border-neutral-300'
                        }`}
                      >
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600 leading-snug">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Where you are */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Where you are</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Co-founding is easier in the same city. This is also how you show up on the map.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  State
                </label>
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition cursor-pointer pr-10"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  District
                </label>
                <div className="relative">
                  <select
                    value={district}
                    disabled={!state || state === 'Not saying' || availableDistricts.length === 0}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition cursor-pointer disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed pr-10"
                  >
                    {!state || state === 'Not saying' ? (
                      <option value="">Pick a state first</option>
                    ) : (
                      <>
                        <option value="">Select district</option>
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Links */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Links</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Work beats a description of work. All optional.
              </p>
            </div>

            <div className="space-y-4">
              {/* Website */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Website
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="yoursite.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  LinkedIn
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <LinkedInIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/you"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  GitHub
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <GitHubIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="github.com/you"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action: Save Profile */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={saving}
              className="px-8 py-3 text-sm font-bold shadow-md shadow-amber-500/10"
            >
              <Save size={16} />
              Save profile
            </Button>

            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> All changes saved
              </span>
            )}
          </div>
        </form>

        {/* SECTION 6: Deactivate account */}
        <div className="mt-14 pt-8 border-t border-neutral-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-red-200 shadow-xs">
            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Deactivate account
            </h2>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-2xl">
              Signs you out everywhere and hides your profile, ideas and events from everyone else.
              Nothing is deleted — signing back in walks you through reactivating it.
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs sm:text-sm font-bold border border-red-200 transition flex items-center gap-2 cursor-pointer"
              >
                Deactivate my account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deactivation */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Are you sure you want to deactivate?
              </h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                This will sign you out on all devices and hide your profile, venture ideas, and events from everyone in the syndicate directory.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-800 font-medium">
                Remember: Nothing is deleted. When you are ready, simply sign back in with your email and password to reactivate your account instantly.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button
                type="button"
                variant="danger"
                size="md"
                loading={deactivating}
                onClick={handleDeactivate}
                className="flex-1 justify-center font-bold"
              >
                Yes, deactivate my account
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setShowDeactivateModal(false)}
                className="text-neutral-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
