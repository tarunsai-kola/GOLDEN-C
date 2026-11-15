import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Link as LinkIcon,
} from 'lucide-react';
import jobService from '../../services/job.service';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function JobSubmission() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myOrganizations } = useOrganization();

  const [formData, setFormData] = useState({
    title: '',
    organizationId: myOrganizations.length > 0 ? (myOrganizations[0].organization?._id || myOrganizations[0]._id) : '',
    department: 'Engineering',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    experience: 'Mid-level (2-5 yrs)',
    location: 'Bangalore, India',
    applicationUrl: '',
    description: '',
    responsibilities: '',
    requirements: '',
    requiredSkills: [],
    salaryRange: {
      min: 15,
      max: 25,
      currency: 'INR',
      isDisclosed: true,
    },
    expiryDays: 30,
  });

  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const departments = [
    'Engineering',
    'Product Management',
    'Design & UX',
    'Data & AI',
    'Growth & Marketing',
    'Sales & Business Dev',
    'Operations & HR',
    'Founder Office',
  ];

  const workplaceTypes = ['Remote', 'Hybrid', 'On-site'];
  const employmentTypes = ['Full-time', 'Internship', 'Co-founder', 'Part-time', 'Contract'];
  const experienceLevels = [
    'Internship / Student',
    'Entry-level (0-2 yrs)',
    'Mid-level (2-5 yrs)',
    'Senior (5-8 yrs)',
    'Lead / Executive (8+ yrs)',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSalaryChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      salaryRange: { ...prev.salaryRange, [field]: val },
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    if (!formData.requiredSkills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()],
      }));
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organizationId) {
      setError('Please select an organization to post this job under.');
      return;
    }
    if (!formData.title.trim() || !formData.applicationUrl.trim() || !formData.description.trim()) {
      setError('Title, external application URL, and description are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        organizationId: formData.organizationId,
        department: formData.department,
        workplaceType: formData.workplaceType,
        employmentType: formData.employmentType,
        experience: formData.experience,
        location: formData.location.trim(),
        applicationUrl: formData.applicationUrl.trim(),
        description: formData.description.trim(),
        responsibilities: formData.responsibilities.trim(),
        requirements: formData.requirements.trim(),
        requiredSkills: formData.requiredSkills,
        salaryRange: {
          min: Number(formData.salaryRange.min),
          max: Number(formData.salaryRange.max),
          currency: formData.salaryRange.currency,
          isDisclosed: formData.salaryRange.isDisclosed,
        },
      };

      await jobService.createJob(payload);
      navigate('/jobs/manage');
    } catch (err) {
      setError(err.message || 'Failed to post job. Please ensure you have Recruiter permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-amber-600 mb-2 transition"
        >
          <ArrowLeft size={13} /> Back to Job Board
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-amber-50 text-amber-800 border border-amber-200">
          <Sparkles size={13} /> Startup Talent Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Post an Open Opportunity
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 mt-1">
          Reach thousands of top-tier engineers, founders, and operators across The Golden Circle.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {myOrganizations.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <Building2 className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">Company Profile Required</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
            You must be an Owner, Administrator, or Recruiter of a verified company to post jobs.
          </p>
          <Link to="/organizations/new">
            <Button variant="primary" size="md">
              Register a Company First
            </Button>
          </Link>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Selection */}
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="text-amber-500" size={18} />
              Hiring Organization
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Posting Company / Startup *
              </label>
              <select
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
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
          </Card>

          {/* Job Overview */}
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="text-amber-500" size={18} />
              Role Overview
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Full-Stack Engineer (React / Node / Go)"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Workplace Type
                  </label>
                  <select
                    name="workplaceType"
                    value={formData.workplaceType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {workplaceTypes.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Employment Type
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {employmentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {experienceLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      name="location"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Bangalore, India (or Global Remote)"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  External Application Link (ATS, Greenhouse, Lever, or Google Form) *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="url"
                    name="applicationUrl"
                    required
                    value={formData.applicationUrl}
                    onChange={handleChange}
                    placeholder="https://jobs.lever.co/company/..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Compensation & Skills */}
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="text-amber-500" size={18} />
              Compensation & Skills
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Minimum Salary (in Lakhs / $k)
                </label>
                <input
                  type="number"
                  value={formData.salaryRange.min}
                  onChange={(e) => handleSalaryChange('min', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Maximum Salary (in Lakhs / $k)
                </label>
                <input
                  type="number"
                  value={formData.salaryRange.max}
                  onChange={(e) => handleSalaryChange('max', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Currency
                </label>
                <select
                  value={formData.salaryRange.currency}
                  onChange={(e) => handleSalaryChange('currency', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Required Skills Adder */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Target Technologies & Skills
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g. React, Node.js, Python, AWS, Docker"
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <Button type="button" variant="primary" size="sm" onClick={handleAddSkill}>
                  <Plus size={14} /> Add Skill
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {formData.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-amber-700 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Description & Responsibilities */}
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} />
              Full Job Description
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  About the Role & Mission *
                </label>
                <textarea
                  rows={4}
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What makes this opportunity unique? Why join your engineering team now?"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Key Responsibilities
                </label>
                <textarea
                  rows={3}
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  placeholder="• Architect and ship scalable microservices&#10;• Collaborate with product and design on feature roadmaps"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Requirements & Qualifications
                </label>
                <textarea
                  rows={3}
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="• 3+ years experience with high-throughput cloud architectures&#10;• Strong communication skills"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </Card>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link to="/jobs" className="text-xs font-semibold text-neutral-500 hover:text-gray-900">
              Cancel
            </Link>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="gap-2">
              Publish Job Opening <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
