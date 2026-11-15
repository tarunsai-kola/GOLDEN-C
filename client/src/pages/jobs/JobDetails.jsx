import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Bookmark,
  Share2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Flag,
} from 'lucide-react';
import jobService from '../../services/job.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import ShareModal from '../../components/ui/ShareModal';
import ReportJobModal from '../../components/jobs/ReportJobModal';
import { generateInitials, formatRelativeTime } from '../../utils/helpers';

export default function JobDetails() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await jobService.getJobBySlugOrId(slugOrId);
        const data = res.job || res;
        setJob(data);

        // Check bookmark
        const savedIds = JSON.parse(localStorage.getItem('gc_saved_jobs') || '[]');
        if (savedIds.includes(data._id || data.id)) {
          setIsSaved(true);
        }
      } catch (err) {
        setError(err.message || 'Job posting not found');
      } finally {
        setLoading(false);
      }
    };

    if (slugOrId) fetchJob();
  }, [slugOrId]);

  const handleApply = async () => {
    const jobId = job._id || job.id;
    setApplying(true);
    try {
      const res = await jobService.applyJob(jobId);
      const targetUrl = res.applicationUrl || job.applicationUrl;
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Application link recorded! Please check company website.');
      }
    } catch {
      if (job.applicationUrl) {
        window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleToggleSave = async () => {
    const jobId = job._id || job.id;
    const next = !isSaved;
    setIsSaved(next);

    const saved = JSON.parse(localStorage.getItem('gc_saved_jobs') || '[]');
    if (next) {
      if (!saved.includes(jobId)) saved.push(jobId);
      await jobService.saveJob(jobId);
    } else {
      const filtered = saved.filter((id) => id !== jobId);
      localStorage.setItem('gc_saved_jobs', JSON.stringify(filtered));
      await jobService.unsaveJob(jobId);
    }
    localStorage.setItem('gc_saved_jobs', JSON.stringify(saved));
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading career opportunity...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Opportunity Not Found</h2>
        <p className="text-neutral-600 mb-6">{error || 'This job listing may have been closed or removed.'}</p>
        <Link to="/jobs">
          <Button variant="primary" size="md">
            Browse Open Roles
          </Button>
        </Link>
      </div>
    );
  }

  const org = job.organization || job.company || {};
  const initials = generateInitials(org.name || job.companyName || 'Startup');
  const skills = job.requiredSkills || [];

  const formatSalary = () => {
    if (!job.salaryRange) return 'Competitive Equity / Salary';
    const { min, max, currency = 'INR', isDisclosed = true } = job.salaryRange;
    if (!isDisclosed) return 'Competitive Equity / Salary';
    if (min && max) {
      return currency === 'INR'
        ? `₹${min} Lakhs - ₹${max} Lakhs`
        : `$${min},000 - $${max},000`;
    }
    return 'Competitive';
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16">
      {/* ── Top Header Navigation ── */}
      <div className="bg-white border-b border-neutral-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-amber-700 transition"
          >
            <ArrowLeft size={14} /> Back to Job Board
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareModalOpen(true)}
              className="p-2 rounded-xl text-neutral-500 hover:text-gray-900 hover:bg-neutral-100 transition cursor-pointer"
              title="Share job"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => setReportModalOpen(true)}
              className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-neutral-100 transition cursor-pointer"
              title="Report suspicious listing"
            >
              <Flag size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Job Details Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Full Job Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 shadow-sm">
              {/* Company Logo + Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="h-16 w-16 rounded-2xl object-contain border border-neutral-200 p-1 bg-white shadow-2xs"
                    />
                  ) : (
                    <div
                      className="h-16 w-16 rounded-2xl border-2 flex items-center justify-center font-bold text-lg shadow-2xs"
                      style={{
                        borderColor: '#C9A84C',
                        color: '#A07830',
                        backgroundColor: '#FFFDF5',
                      }}
                    >
                      {initials}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/organizations/${org._id || org.id}`}
                        className="text-sm font-semibold text-neutral-600 hover:text-amber-800 transition"
                      >
                        {org.name || job.companyName}
                      </Link>
                      {org.status === 'active' && (
                        <ShieldCheck size={14} className="text-amber-600" />
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                      {job.title}
                    </h1>
                  </div>
                </div>

                <button
                  onClick={handleToggleSave}
                  className={`p-2.5 rounded-2xl border transition cursor-pointer self-start sm:self-auto ${
                    isSaved
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-white border-neutral-200 text-neutral-400 hover:text-gray-900 hover:bg-neutral-50'
                  }`}
                  title={isSaved ? 'Bookmarked' : 'Save opportunity'}
                >
                  <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
                </button>
              </div>

              {/* Pills Metadata Bar */}
              <div className="flex flex-wrap items-center gap-2 pb-6 mb-6 border-b border-neutral-100 text-xs">
                <span className="px-3 py-1 rounded-full font-semibold bg-green-50 text-green-700 border border-green-200">
                  {job.workplaceType || 'Remote'}
                </span>
                <span className="px-3 py-1 rounded-full font-medium bg-neutral-100 text-neutral-700">
                  {job.employmentType || 'Full-time'}
                </span>
                {job.experience && (
                  <span className="px-3 py-1 rounded-full font-medium bg-neutral-100 text-neutral-700">
                    {job.experience}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1 text-neutral-600 ml-1">
                    <MapPin size={13} className="text-neutral-400" />
                    <span>{job.location}</span>
                  </span>
                )}
              </div>

              {/* Key Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mb-8 text-xs">
                <div>
                  <span className="text-neutral-400 font-medium block mb-0.5">Offered Compensation</span>
                  <span className="font-bold text-gray-900">{formatSalary()}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium block mb-0.5">Department / Function</span>
                  <span className="font-bold text-gray-900">{job.department || 'Engineering'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium block mb-0.5">Listing Status</span>
                  <span className="font-bold text-green-700">Active & Recruiting</span>
                </div>
              </div>

              {/* Job Description & Requirements */}
              <div className="space-y-6 text-neutral-700 text-sm leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">About the Opportunity</h3>
                  <div className="whitespace-pre-line">{job.description}</div>
                </div>

                {job.responsibilities && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3">Key Responsibilities</h3>
                    <div className="whitespace-pre-line">{job.responsibilities}</div>
                  </div>
                )}

                {job.requirements && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3">Requirements & Qualifications</h3>
                    <div className="whitespace-pre-line">{job.requirements}</div>
                  </div>
                )}
              </div>

              {/* Required Skills Badges */}
              {skills.length > 0 && (
                <div className="pt-6 mt-8 border-t border-neutral-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Target Skills & Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Apply CTA & Company Profile Card */}
          <div className="space-y-6">
            {/* Direct Apply CTA Box */}
            <Card padding="lg" className="border-amber-200/90 shadow-md">
              <h3 className="font-bold text-gray-900 text-base mb-1">Apply for this Role</h3>
              <p className="text-xs text-neutral-500 mb-6">
                Applications are processed directly through {org.name || 'the startup'}'s career portal.
              </p>

              <Button
                variant="primary"
                size="lg"
                loading={applying}
                onClick={handleApply}
                className="w-full justify-center gap-2 text-sm py-3 shadow-md mb-3"
              >
                Apply on Company Site <ExternalLink size={15} />
              </Button>

              <div className="text-center text-[11px] text-neutral-400">
                Redirects to verified ATS or application form
              </div>
            </Card>

            {/* Company Profile Snapshot */}
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-12 w-12 rounded-xl border flex items-center justify-center font-bold text-sm"
                  style={{
                    borderColor: '#C9A84C',
                    color: '#A07830',
                    backgroundColor: '#FFFDF5',
                  }}
                >
                  {initials}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{org.name || 'Company Profile'}</h4>
                  <span className="text-xs text-neutral-500 capitalize">{org.type || 'Tech Company'}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 line-clamp-3 mb-4 leading-relaxed">
                {org.companyProfile?.tagline || org.description || 'Verified startup in The Golden Circle.'}
              </p>

              <Link to={`/organizations/${org._id || org.id}`}>
                <Button variant="secondary" size="sm" className="w-full justify-center text-xs">
                  View Full Company Profile
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        companyName={`${job.title} at ${org.name || 'Startup'}`}
      />

      {/* Report Modal */}
      <ReportJobModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        jobId={job._id || job.id}
        jobTitle={job.title}
        onReport={(jId, payload) => jobService.reportJob(jId, payload)}
      />
    </div>
  );
}
