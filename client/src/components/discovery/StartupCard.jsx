import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  ShieldCheck,
  Bookmark,
  Heart,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Badge from '../ui/Badge';
import { generateInitials } from '../../utils/helpers';

export default function StartupCard({
  startup,
  isSaved = false,
  isFollowed = false,
  onToggleSave,
  onToggleFollow,
}) {
  const org = startup.organization || startup;
  const profile = startup.companyProfile || startup.profile || org.companyProfile || org.profile || {};
  const orgId = org._id || org.id || startup._id || startup.id;

  const initials = generateInitials(org.name || 'Startup');
  const [localSaved, setLocalSaved] = useState(isSaved);
  const [localFollowed, setLocalFollowed] = useState(isFollowed);
  const [followerCount, setFollowerCount] = useState(startup.followerCount || profile.followerCount || 42);

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !localSaved;
    setLocalSaved(next);
    if (onToggleSave) onToggleSave(orgId, next);
  };

  const handleFollowClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !localFollowed;
    setLocalFollowed(next);
    setFollowerCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    if (onToggleFollow) onToggleFollow(orgId, next);
  };

  const cover = profile.coverImage || org.coverImage;
  const logo = org.logo || profile.logo;
  const isHiring = profile.isHiring || startup.isHiring;

  return (
    <div className="group rounded-3xl border border-neutral-200/90 bg-white shadow-xs hover:shadow-lg hover:-translate-y-1 transition duration-200 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Card Header Cover Banner */}
        <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-neutral-900">
          {cover ? (
            <img
              src={cover}
              alt={`${org.name} cover`}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 60%, #A07830 100%)',
              }}
            />
          )}

          {/* Top badges & Bookmark button */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5">
              {profile.companyStage && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-neutral-800 backdrop-blur-xs shadow-2xs">
                  {profile.companyStage}
                </span>
              )}
              {isHiring && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500 text-white shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Hiring
                </span>
              )}
            </div>

            <button
              onClick={handleSaveClick}
              className={`p-1.5 rounded-full backdrop-blur-xs transition cursor-pointer shadow-2xs ${
                localSaved
                  ? 'bg-amber-500 text-white'
                  : 'bg-black/30 text-white hover:bg-black/50'
              }`}
              title={localSaved ? 'Remove Bookmark' : 'Save Startup'}
              aria-label="Bookmark startup"
            >
              <Bookmark size={14} className={localSaved ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        {/* Logo & Identity */}
        <div className="px-5 pt-0 pb-4 relative">
          {/* Overlapping Logo */}
          <div className="-mt-9 mb-3 flex items-end justify-between">
            {logo ? (
              <img
                src={logo}
                alt={org.name}
                className="h-14 w-14 rounded-2xl object-contain border-2 border-white shadow-md bg-white p-1"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-2xl border-2 border-white shadow-md flex items-center justify-center font-bold text-base"
                style={{
                  borderColor: '#C9A84C',
                  color: '#A07830',
                  backgroundColor: '#FFFDF5',
                }}
              >
                {initials}
              </div>
            )}

            {/* Follow Button */}
            <button
              onClick={handleFollowClick}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition cursor-pointer ${
                localFollowed
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Heart size={12} className={localFollowed ? 'fill-red-500 text-red-500' : ''} />
              <span>{followerCount}</span>
            </button>
          </div>

          {/* Name & Tagline */}
          <div className="mb-3">
            <Link to={`/organizations/${orgId}`}>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-amber-700 transition flex items-center gap-1.5">
                <span className="truncate">{org.name}</span>
                {org.status === 'active' && (
                  <ShieldCheck size={14} className="text-amber-600 flex-shrink-0" />
                )}
              </h3>
            </Link>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
              {profile.tagline || org.description || 'Pioneering startup in The Golden Circle ecosystem.'}
            </p>
          </div>

          {/* Sector, Location, Team metadata */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
            {profile.industry && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50/70 text-amber-900 font-medium border border-amber-100">
                {profile.industry}
              </span>
            )}
            {org.location && (
              <span className="inline-flex items-center gap-1 text-neutral-500">
                <MapPin size={11} className="text-neutral-400" />
                <span className="truncate max-w-[110px]">{org.location}</span>
              </span>
            )}
            {profile.teamSize && (
              <span className="inline-flex items-center gap-1 text-neutral-500 ml-auto">
                <Users size={11} className="text-neutral-400" />
                {profile.teamSize}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Link */}
      <div className="px-5 py-3 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400 capitalize">
          {org.type || 'Company'}
        </span>
        <Link
          to={`/organizations/${orgId}`}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          View Profile <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
