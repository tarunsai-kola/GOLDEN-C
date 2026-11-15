import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Bookmark,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import Badge from '../ui/Badge';
import { generateInitials, formatRelativeTime } from '../../utils/helpers';

export default function JobCard({
  job,
  isSaved = false,
  onToggleSave,
}) {
  const org = job.organization || job.company || {};
  const jobId = job._id || job.id;
  const initials = generateInitials(org.name || job.companyName || 'Startup');

  const [localSaved, setLocalSaved] = useState(isSaved);

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !localSaved;
    setLocalSaved(next);
    if (onToggleSave) onToggleSave(jobId, next);
  };

  const workplaceBadge = {
    Remote: 'bg-green-50 text-green-700 border-green-200',
    Hybrid: 'bg-purple-50 text-purple-700 border-purple-200',
    'On-site': 'bg-neutral-100 text-neutral-700 border-neutral-200',
  }[job.workplaceType] || 'bg-green-50 text-green-700 border-green-200';

  const formatSalary = () => {
    if (!job.salaryRange) return 'Competitive Equity / Salary';
    const { min, max, currency = 'INR', isDisclosed = true } = job.salaryRange;
    if (!isDisclosed) return 'Competitive';
    if (min && max) {
      return currency === 'INR'
        ? `₹${min}L - ₹${max}L`
        : `$${min}k - $${max}k`;
    }
    if (min) return `${currency} ${min}+`;
    return 'Competitive';
  };

  const skills = job.requiredSkills || [];
  const postedTime = job.createdAt ? formatRelativeTime(job.createdAt) : 'Recently';

  return (
    <div className="group rounded-3xl border border-neutral-200/90 bg-white shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition duration-200 p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3.5">
            {org.logo ? (
              <img
                src={org.logo}
                alt={org.name}
                className="h-12 w-12 rounded-2xl object-contain border border-neutral-200 p-1 bg-white flex-shrink-0"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-2xl border-2 flex items-center justify-center font-bold text-xs flex-shrink-0"
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
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 truncate max-w-[150px]">
                  {org.name || job.companyName || 'Pioneering Startup'}
                </span>
                {org.status === 'active' && (
                  <ShieldCheck size={13} className="text-amber-600 flex-shrink-0" />
                )}
              </div>

              <Link to={`/jobs/${job.slug || jobId}`}>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-amber-700 transition leading-snug line-clamp-1">
                  {job.title}
                </h3>
              </Link>
            </div>
          </div>

          <button
            onClick={handleSaveClick}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              localSaved
                ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                : 'bg-white border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50'
            }`}
            title={localSaved ? 'Remove Bookmark' : 'Save Opportunity'}
          >
            <Bookmark size={15} className={localSaved ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Location & Employment Pills Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5 text-xs">
          <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${workplaceBadge}`}>
            {job.workplaceType || 'Remote'}
          </span>

          <span className="px-2.5 py-0.5 rounded-full font-medium bg-neutral-100 text-neutral-700">
            {job.employmentType || 'Full-time'}
          </span>

          {job.experience && (
            <span className="px-2.5 py-0.5 rounded-full font-medium bg-neutral-100 text-neutral-600">
              {job.experience}
            </span>
          )}

          {job.location && (
            <span className="inline-flex items-center gap-1 text-neutral-500">
              <MapPin size={12} className="text-neutral-400" />
              <span>{job.location}</span>
            </span>
          )}
        </div>

        {/* Short description */}
        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">
          {job.summary || job.description?.slice(0, 160) || 'Exciting career opportunity at a verified startup.'}
        </p>

        {/* Skills Tags */}
        {skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50/70 text-amber-900 border border-amber-200/60"
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Bottom: Compensation & Apply CTA */}
      <div className="pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-gray-900 text-xs sm:text-sm">{formatSalary()}</span>
          <span className="text-[11px] text-neutral-400 block">{postedTime}</span>
        </div>

        <Link to={`/jobs/${job.slug || jobId}`}>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 group-hover:translate-x-0.5 transition-transform">
            View Details <ArrowRight size={13} />
          </span>
        </Link>
      </div>
    </div>
  );
}
