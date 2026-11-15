import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Globe,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building2,
  ArrowLeft,
  Crown,
} from 'lucide-react';
import eventService from '../../services/event.service';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function EventSubmission() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myOrganizations } = useOrganization();

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    category: 'Masterclass',
    format: 'Online',
    pricingType: 'Free',
    venue: '',
    meetingUrl: '',
    date: '',
    startTime: '18:00',
    endTime: '19:30',
    capacity: 250,
    thumbnail: '',
    organizationId: myOrganizations.length > 0 ? (myOrganizations[0].organization?._id || myOrganizations[0]._id) : '',
    speakers: [],
  });

  const [newSpeaker, setNewSpeaker] = useState({ name: '', title: '', company: '', photo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    'Masterclass',
    'Demo Day',
    'Hackathon',
    'Pitch Session',
    'Networking',
    'Workshop',
    'Panel',
    'AMA',
  ];

  const formats = ['Online', 'Offline', 'Hybrid'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleAddSpeaker = () => {
    if (!newSpeaker.name.trim()) return;
    setFormData((prev) => ({
      ...prev,
      speakers: [...prev.speakers, newSpeaker],
    }));
    setNewSpeaker({ name: '', title: '', company: '', photo: '' });
  };

  const handleRemoveSpeaker = (idx) => {
    setFormData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      setError('Title and Event Date are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity) || 100,
        organizationId: formData.organizationId || undefined,
        organizerType: formData.organizationId ? 'Company' : 'Independent',
      };

      const result = await eventService.createEvent(payload);
      navigate('/events/manage');
    } catch (err) {
      setError(err.message || 'Failed to submit event. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-amber-600 mb-2 transition"
        >
          <ArrowLeft size={13} /> Back to Events
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-amber-50 text-amber-800 border border-amber-200">
          <Sparkles size={13} /> Community Event Creator
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Host an Ecosystem Event
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 mt-1">
          Publish masterclasses, founder webinars, or in-person investor mixers to The Golden Circle network.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Metadata */}
        <Card padding="lg">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="text-amber-500" size={18} />
            Event Overview & Format
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Session Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Scaling B2B SaaS from Seed to Series A: Playbook & Metrics"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Short Elevator Summary (1-2 sentences)
              </label>
              <input
                type="text"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="A masterclass on go-to-market strategies with top SaaS unicorn operators."
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Format
                </label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Pricing Type
                </label>
                <select
                  name="pricingType"
                  value={formData.pricingType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Free">Free RSVP</option>
                  <option value="Paid">Paid Ticket</option>
                </select>
              </div>
            </div>

            {/* Host Organization Selector */}
            {myOrganizations.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Host As Organization
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Independent Community Host</option>
                  {myOrganizations.map((m) => {
                    const o = m.organization || m;
                    return (
                      <option key={o._id || o.id} value={o._id || o.id}>
                        {o.name} ({m.role || 'Member'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Schedule & Location */}
        <Card padding="lg">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="text-amber-500" size={18} />
            Date, Schedule & Access Links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Virtual Meeting URL (Zoom, Google Meet, or Stream)
              </label>
              <input
                type="url"
                name="meetingUrl"
                value={formData.meetingUrl}
                onChange={handleChange}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Physical Venue / Address (If In-Person)
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="Innovation Hub, Indiranagar, Bangalore"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </Card>

        {/* Detailed Description */}
        <Card padding="lg">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={18} />
            Expanded Description & Syllabus
          </h2>

          <textarea
            rows={5}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Share full details of the session, who should attend, prerequisites, and learning outcomes..."
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </Card>

        {/* Speakers Manager */}
        <Card padding="lg">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="text-amber-500" size={18} />
            Speakers & Instructors
          </h2>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Speaker Name"
                value={newSpeaker.name}
                onChange={(e) => setNewSpeaker({ ...newSpeaker, name: e.target.value })}
                className="px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                type="text"
                placeholder="Title / Designation"
                value={newSpeaker.title}
                onChange={(e) => setNewSpeaker({ ...newSpeaker, title: e.target.value })}
                className="px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                type="text"
                placeholder="Company / Affiliation"
                value={newSpeaker.company}
                onChange={(e) => setNewSpeaker({ ...newSpeaker, company: e.target.value })}
                className="px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="primary" size="sm" onClick={handleAddSpeaker} className="text-xs">
                <Plus size={14} /> Add Speaker
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {formData.speakers.map((sp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-neutral-200 bg-white flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-gray-900">{sp.name}</span>
                  <span className="text-neutral-500 ml-2">
                    {sp.title} {sp.company && `at ${sp.company}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSpeaker(idx)}
                  className="text-neutral-400 hover:text-red-600 transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <Link to="/events" className="text-xs font-semibold text-neutral-500 hover:text-gray-900">
            Cancel
          </Link>
          <Button type="submit" variant="primary" size="lg" loading={loading} className="gap-2">
            Submit Event for Publishing <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
