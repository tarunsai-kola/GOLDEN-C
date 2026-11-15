import { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Check,
  Save,
  Tag,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function AdminPlatformConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    industries: [
      'Artificial Intelligence',
      'Fintech',
      'SaaS & Enterprise',
      'Climate Tech',
      'Healthtech & Biotech',
      'Consumer & D2C',
      'E-commerce & Quick Commerce',
      'DeepTech & Robotics',
      'Web3 & Crypto',
      'Edtech',
    ],
    categories: ['Fintech', 'AI / ML', 'Enterprise', 'Healthcare', 'Sustainability'],
    eventFormats: ['Virtual', 'In-person', 'Hybrid'],
  });

  const [newIndustry, setNewIndustry] = useState('');
  const [newFormat, setNewFormat] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const res = await adminService.getConfig();
        if (res && (res.industries?.length || res.eventFormats?.length)) {
          setConfig(res);
        }
      } catch (err) {
        console.warn('Failed to fetch config:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleAddIndustry = (e) => {
    e.preventDefault();
    if (!newIndustry.trim()) return;
    if (!config.industries.includes(newIndustry.trim())) {
      setConfig({ ...config, industries: [...config.industries, newIndustry.trim()] });
    }
    setNewIndustry('');
  };

  const handleRemoveIndustry = (ind) => {
    setConfig({ ...config, industries: config.industries.filter((i) => i !== ind) });
  };

  const handleAddFormat = (e) => {
    e.preventDefault();
    if (!newFormat.trim()) return;
    if (!config.eventFormats.includes(newFormat.trim())) {
      setConfig({ ...config, eventFormats: [...config.eventFormats, newFormat.trim()] });
    }
    setNewFormat('');
  };

  const handleRemoveFormat = (fmt) => {
    setConfig({ ...config, eventFormats: config.eventFormats.filter((f) => f !== fmt) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateConfig(config);
      alert('Platform configuration saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update platform configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs text-neutral-500">Loading ecosystem taxonomy & platform configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <Sliders className="w-4 h-4 text-amber-600" /> Platform Taxonomy & Config
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Global Metadata & System Parameters</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure live industries, categories, summit formats, and platform dropdown options across the platform.
          </p>
        </div>

        <Button onClick={handleSave} size="md" variant="primary" loading={saving} className="gap-2 shadow-xs">
          <Save className="w-4 h-4" /> Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industries Editor */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-charcoal">
            <Building2 className="w-4 h-4 text-amber-600" />
            <h3>Supported Industries & Sectors ({config.industries?.length || 0})</h3>
          </div>
          <p className="text-xs text-neutral-500">Used across startup discovery, company registration, and filter sidebars.</p>

          <form onSubmit={handleAddIndustry} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add new industry (e.g. Spatial Computing)..."
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              className="flex-1 text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Button size="sm" variant="secondary" type="submit" className="text-xs">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {config.industries?.map((ind) => (
              <span
                key={ind}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-amber-50 text-amber-900 border border-amber-200"
              >
                <span>{ind}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIndustry(ind)}
                  className="p-0.5 hover:text-red-600 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Event Formats Editor */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-charcoal">
            <Calendar className="w-4 h-4 text-amber-600" />
            <h3>Event Delivery Formats ({config.eventFormats?.length || 0})</h3>
          </div>
          <p className="text-xs text-neutral-500">Options available when organizers submit masterclasses and summits.</p>

          <form onSubmit={handleAddFormat} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add format (e.g. Virtual Livestream)..."
              value={newFormat}
              onChange={(e) => setNewFormat(e.target.value)}
              className="flex-1 text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Button size="sm" variant="secondary" type="submit" className="text-xs">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {config.eventFormats?.map((fmt) => (
              <span
                key={fmt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-blue-50 text-blue-900 border border-blue-200"
              >
                <span>{fmt}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFormat(fmt)}
                  className="p-0.5 hover:text-red-600 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
