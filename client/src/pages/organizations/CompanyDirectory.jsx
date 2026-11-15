import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Building2,
  MapPin,
  ExternalLink,
  Users,
  Filter,
  PlusCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';
import organizationService from '../../services/organization.service';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { generateInitials } from '../../utils/helpers';

export default function CompanyDirectory() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');

  const industries = [
    'All Industries',
    'SaaS',
    'AI & Machine Learning',
    'Fintech',
    'Healthtech',
    'Edtech',
    'CleanTech & Energy',
    'E-commerce & Retail',
  ];

  const stages = [
    { label: 'All Stages', value: 'all' },
    { label: 'Idea', value: 'Idea' },
    { label: 'Seed', value: 'Seed' },
    { label: 'Early Stage', value: 'Early Stage' },
    { label: 'Growth', value: 'Growth' },
    { label: 'Scaleup', value: 'Scaleup' },
  ];

  useEffect(() => {
    const fetchPublicOrgs = async () => {
      setLoading(true);
      try {
        const res = await organizationService.getPublicOrganizations();
        const list = Array.isArray(res) ? res : res?.organizations || [];
        setOrganizations(list);
      } catch (err) {
        console.error('Failed to load public directory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicOrgs();
  }, []);

  const filteredOrgs = organizations.filter((org) => {
    const profile = org.companyProfile || org.profile || {};
    const nameMatches =
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.tagline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const industryMatches =
      selectedIndustry === 'all' ||
      selectedIndustry === 'All Industries' ||
      profile.industry === selectedIndustry;

    const stageMatches =
      selectedStage === 'all' || profile.companyStage === selectedStage;

    return nameMatches && industryMatches && stageMatches;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 bg-amber-50 text-amber-800 border border-amber-200">
            🌟 Ecosystem Directory
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Discover Verified Startups
          </h1>
          <p className="text-neutral-600 mt-2 max-w-2xl text-sm sm:text-base">
            Explore companies, emerging ventures, and top tier ecosystem partners building the future.
          </p>
        </div>

        <Link to="/organizations/new">
          <Button variant="primary" size="md" className="gap-2">
            <PlusCircle size={16} /> Register Startup
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search startups by name, mission, or location..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              {stages.map((stg) => (
                <option key={stg.value} value={stg.value}>
                  {stg.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Startup Listing Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Loading ecosystem startups...</p>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No startups found"
          description={
            searchTerm
              ? `No companies matched "${searchTerm}". Try a different search query or filter.`
              : 'Be the first pioneer to register a company on The Golden Circle!'
          }
          action={
            <Link to="/organizations/new" className="mt-4 inline-block">
              <Button variant="primary" size="md">
                Register Your Startup
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => {
            const profile = org.companyProfile || org.profile || {};
            const initials = generateInitials(org.name);

            return (
              <Card
                key={org._id || org.id}
                hover
                padding="none"
                className="flex flex-col justify-between overflow-hidden border border-neutral-200"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="h-12 w-12 rounded-xl object-contain border border-neutral-200 bg-white p-1"
                        />
                      ) : (
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
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg hover:text-amber-700 transition">
                          <Link to={`/organizations/${org._id || org.id}`}>
                            {org.name}
                          </Link>
                        </h3>
                        {org.location && (
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <MapPin size={12} /> {org.location}
                          </div>
                        )}
                      </div>
                    </div>

                    {profile.companyStage && (
                      <Badge variant="gold">{profile.companyStage}</Badge>
                    )}
                  </div>

                  <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
                    {profile.tagline || org.description || 'Innovative company building in The Golden Circle.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
                    {profile.industry && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                        {profile.industry}
                      </span>
                    )}
                    {profile.teamSize && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 flex items-center gap-1">
                        <Users size={11} /> {profile.teamSize}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 capitalize">
                    {org.type || 'Company'}
                  </span>
                  <Link
                    to={`/organizations/${org._id || org.id}`}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    View Profile <ArrowRight size={13} />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
