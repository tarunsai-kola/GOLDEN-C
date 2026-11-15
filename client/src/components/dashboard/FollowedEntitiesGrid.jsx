import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  User,
  Heart,
  HeartOff,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { generateInitials } from '../../utils/helpers';

export default function FollowedEntitiesGrid({
  followedEntities = [],
  onUnfollow,
}) {
  const [loadingId, setLoadingId] = useState(null);

  const handleUnfollow = async (targetType, targetId) => {
    setLoadingId(targetId);
    try {
      await onUnfollow?.(targetType, targetId);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
            <Heart className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Followed Ventures & Leaders ({followedEntities.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Receive automatic alerts when your favorite organizations announce funding rounds or open positions.
            </p>
          </div>
        </div>

        <Link
          to="/discover"
          className="text-xs font-semibold text-amber-700 hover:text-amber-800"
        >
          Discover More
        </Link>
      </div>

      {followedEntities.length === 0 ? (
        <div className="p-8 rounded-2xl bg-neutral-50 text-center border border-neutral-200/80">
          <Building2 className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-neutral-500 mb-3">
            You are not currently following any startups or founders.
          </p>
          <Link to="/discover">
            <Button variant="secondary" size="sm" className="text-xs">
              Explore Startups to Follow
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {followedEntities.map((item) => {
            const isOrg = item.targetType === 'company' || Boolean(item.organization);
            const entity = item.target || item.organization || item.user || item;
            const entityId = entity._id || entity.id;
            const targetType = isOrg ? 'company' : 'user';
            const name = entity.name || entity.fullName || 'Ecosystem Entity';
            const initials = generateInitials(name);

            return (
              <div
                key={item._id || entityId}
                className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-amber-300 transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-10 w-10 rounded-xl border flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{
                      borderColor: '#C9A84C',
                      color: '#A07830',
                      backgroundColor: '#FFFDF5',
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">
                      {name}
                    </h4>
                    <span className="text-[11px] text-neutral-400 capitalize truncate block">
                      {entity.industry || entity.headline || (isOrg ? 'Venture' : 'Founder')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link
                    to={isOrg ? `/organizations/${entityId}` : `/network`}
                  >
                    <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1">
                      View
                    </Button>
                  </Link>

                  <button
                    disabled={loadingId === entityId}
                    onClick={() => handleUnfollow(targetType, entityId)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition"
                    title="Unfollow"
                  >
                    <HeartOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
