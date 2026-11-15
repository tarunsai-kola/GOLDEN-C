import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  MapPin,
  Calendar,
  Users,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import organizationService from '../../services/organization.service';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export default function OrgSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshMyOrganizations } = useOrganization();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    location: '',
    website: '',
    tagline: '',
    description: '',
    industry: 'SaaS',
    foundedYear: 2024,
    companyStage: 'Seed',
    teamSize: '1-10',
  });

  const [userRole, setUserRole] = useState(null);

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

  useEffect(() => {
    const fetchOrgData = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgRes = await organizationService.getById(id);
        const org = orgRes.organization || orgRes;
        const prof = org.companyProfile || org.profile || {};

        setFormData({
          name: org.name || '',
          logo: org.logo || '',
          location: org.location || '',
          website: org.website || '',
          tagline: prof.tagline || '',
          description: prof.description || org.description || '',
          industry: prof.industry || 'SaaS',
          foundedYear: prof.foundedYear || new Date().getFullYear(),
          companyStage: prof.companyStage || 'Seed',
          teamSize: prof.teamSize || '1-10',
        });

        // Check user role
        try {
          const membersData = await organizationService.getMembers(id);
          const list = Array.isArray(membersData) ? membersData : membersData.members || [];
          const cur = list.find(
            (m) => (m.user?._id || m.userId || m.user?.id) === (user?._id || user?.id)
          );
          setUserRole(cur?.role || 'Member');
        } catch {
          setUserRole('Member');
        }
      } catch (err) {
        setError(err.message || 'Failed to load organization settings');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrgData();
  }, [id, user]);

  const canEdit =
    userRole === 'Owner' || userRole === 'Administrator' || userRole === 'Editor';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      setError('You do not have permission to modify this company profile.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await organizationService.update(id, {
        name: formData.name.trim(),
        logo: formData.logo.trim() || undefined,
        location: formData.location.trim(),
        website: formData.website.trim() || undefined,
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        industry: formData.industry,
        foundedYear: Number(formData.foundedYear),
        companyStage: formData.companyStage,
        teamSize: formData.teamSize,
      });

      setSuccess('Company profile updated successfully!');
      await refreshMyOrganizations();
    } catch (err) {
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link
          to={`/organizations/${id}/dashboard`}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-amber-600 mb-2 transition"
        >
          <ArrowLeft size={13} /> Back to Company Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Company Settings & Profile
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Update branding, public metadata, and directory information
        </p>
      </div>

      {!canEdit && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-2.5">
          <ShieldAlert size={18} className="text-amber-600 flex-shrink-0" />
          <span>
            You have a <strong>{userRole || 'Member'}</strong> role. Only Owners,
            Administrators, and Editors may save changes.
          </span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-amber-500" />
            Basic Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                name="name"
                disabled={!canEdit}
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Headquarters Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  name="location"
                  disabled={!canEdit}
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Official Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="url"
                  name="website"
                  disabled={!canEdit}
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Logo URL
              </label>
              <input
                type="url"
                name="logo"
                disabled={!canEdit}
                value={formData.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100"
              />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tag size={18} className="text-amber-500" />
            Startup Metadata
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Tagline
              </label>
              <input
                type="text"
                name="tagline"
                disabled={!canEdit}
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Industry
              </label>
              <select
                name="industry"
                disabled={!canEdit}
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white disabled:bg-neutral-100"
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
                Funding Stage
              </label>
              <select
                name="companyStage"
                disabled={!canEdit}
                value={formData.companyStage}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white disabled:bg-neutral-100"
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
              <input
                type="number"
                name="foundedYear"
                disabled={!canEdit}
                value={formData.foundedYear}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Team Size
              </label>
              <select
                name="teamSize"
                disabled={!canEdit}
                value={formData.teamSize}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white disabled:bg-neutral-100"
              >
                {teamSizes.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz} Employees
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Description / Mission Statement
              </label>
              <textarea
                name="description"
                rows={4}
                disabled={!canEdit}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100"
              />
            </div>
          </div>
        </Card>

        {canEdit && (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              className="gap-2"
            >
              <Save size={15} /> Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
