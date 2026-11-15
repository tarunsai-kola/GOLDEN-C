import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Globe, MapPin, Tag, Calendar, Users, FileText, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import organizationService from '../../services/organization.service';
import { useOrganization } from '../../context/OrganizationContext';
import Button from '../../components/ui/Button';

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { refreshMyOrganizations, switchOrganization } = useOrganization();

  const [formData, setFormData] = useState({
    name: '',
    type: 'company',
    logo: '',
    location: '',
    website: '',
    tagline: '',
    description: '',
    industry: 'SaaS',
    foundedYear: new Date().getFullYear(),
    companyStage: 'Seed',
    teamSize: '1-10',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const industries = [
    'SaaS',
    'AI & Machine Learning',
    'Fintech',
    'Healthtech',
    'Edtech',
    'E-commerce & Retail',
    'CleanTech & Energy',
    'Cybersecurity',
    'Web3 & Crypto',
    'Consumer Tech',
    'Enterprise Software',
  ];

  const stages = [
    { label: 'Idea / Pre-seed', value: 'Idea' },
    { label: 'Seed Funded', value: 'Seed' },
    { label: 'Early Stage (Series A)', value: 'Early Stage' },
    { label: 'Growth Stage (Series B+)', value: 'Growth' },
    { label: 'Enterprise / Scaleup', value: 'Scaleup' },
  ];

  const teamSizes = ['1-10', '11-50', '51-200', '201-500', '500+'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        logo: formData.logo.trim() || undefined,
        location: formData.location.trim(),
        website: formData.website.trim() || undefined,
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        industry: formData.industry,
        foundedYear: Number(formData.foundedYear) || new Date().getFullYear(),
        companyStage: formData.companyStage,
        teamSize: formData.teamSize,
      };

      const result = await organizationService.create(payload);
      const newOrg = result.organization || result;
      const orgId = newOrg._id || newOrg.id;

      await refreshMyOrganizations();
      if (orgId) {
        switchOrganization(orgId);
        navigate(`/organizations/${orgId}/dashboard`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 border border-amber-200 bg-amber-50 text-amber-800">
          <Sparkles size={13} /> Organization Builder
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Launch Your Company Profile
        </h1>
        <p className="text-neutral-600 mt-2 text-sm sm:text-base">
          Establish your startup's presence on The Golden Circle to recruit top talent, showcase achievements, and engage with investors.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Identity */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Building2 className="text-amber-500" size={20} />
            Company Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Company / Startup Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Acme Innovations Inc."
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Organization Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="company">Startup / Company</option>
                <option value="incubator">Incubator / Accelerator</option>
                <option value="investor">Venture Capital / Angel Fund</option>
                <option value="college">University / Academic Institution</option>
                <option value="community">Ecosystem Community</option>
                <option value="partner">Corporate Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Headquarters Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Bangalore, India"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Official Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Logo Image URL (Optional)
              </label>
              <input
                type="url"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Industry & Stage Profile */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Tag className="text-amber-500" size={20} />
            Startup Profile & Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                One-Line Tagline *
              </label>
              <input
                type="text"
                name="tagline"
                required
                value={formData.tagline}
                onChange={handleChange}
                placeholder="e.g. Next-generation autonomous workflow agents for modern teams"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Primary Industry *
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Current Funding Stage
              </label>
              <select
                name="companyStage"
                value={formData.companyStage}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                {stages.map((stg) => (
                  <option key={stg.value} value={stg.value}>
                    {stg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Founded Year
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="number"
                  name="foundedYear"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.foundedYear}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Team Size
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <select
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  {teamSizes.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} Employees
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Company Description / Pitch
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Share your mission, problem statement, key achievements, or what makes your team unique..."
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link to="/dashboard" className="text-sm text-neutral-600 hover:text-gray-900 order-2 sm:order-1">
            Cancel & Return to Dashboard
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full sm:w-auto order-1 sm:order-2 gap-2"
          >
            Create Company Profile
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
