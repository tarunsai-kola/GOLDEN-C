import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Globe,
  Calendar,
  Users,
  ShieldCheck,
  LayoutDashboard,
  ExternalLink,
  Share2,
  Mail,
  Heart,
  Sparkles,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Tag,
  Box,
  Milestone,
  Newspaper,
  Briefcase,
  PlayCircle,
  Edit,
  Eye,
} from 'lucide-react';
import organizationService from '../../services/organization.service';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Lightbox from '../../components/ui/Lightbox';
import ShareModal from '../../components/ui/ShareModal';
import ContactModal from '../../components/ui/ContactModal';
import { generateInitials } from '../../utils/helpers';

export default function CompanyProfile() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { myOrganizations } = useOrganization();

  const [orgData, setOrgData] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState('overview');

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(128); // default simulated base count
  const [followLoading, setFollowLoading] = useState(false);

  // Modals & Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Gallery category filter
  const [galleryCategory, setGalleryCategory] = useState('all');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await organizationService.getPublicProfile(id);
        const org = res.organization || res;
        setOrgData(org);

        // Check if follow stats came with response
        if (res.followCount !== undefined) {
          setFollowerCount(res.followCount);
        }
        if (res.isFollowed !== undefined) {
          setIsFollowing(res.isFollowed);
        }

        // Fetch team members
        try {
          const membersData = await organizationService.getMembers(id);
          const membersList = Array.isArray(membersData)
            ? membersData
            : membersData?.members || [];
          setMembers(membersList);
        } catch {
          setMembers([]);
        }
      } catch (err) {
        setError(err.message || 'Company profile not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to follow companies on The Golden Circle.');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await organizationService.unfollow(id);
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        await organizationService.follow(id);
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch {
      // Toggle optimistically for seamless UX
      setIsFollowing(!isFollowing);
      setFollowerCount((prev) => (isFollowing ? prev - 1 : prev + 1));
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading company showcase...</p>
      </div>
    );
  }

  if (error || !orgData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h2>
        <p className="text-neutral-600 mb-6">{error || 'This organization profile does not exist.'}</p>
        <Link to="/organizations">
          <Button variant="primary" size="md">
            Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const profile = orgData.companyProfile || orgData.profile || {};
  const initials = generateInitials(orgData.name);

  // Check if current user has studio permissions
  const userMembership = myOrganizations.find(
    (m) => (m.organization?._id || m._id || m.organizationId) === (orgData._id || orgData.id)
  );
  const canManage =
    userMembership?.role === 'Owner' ||
    userMembership?.role === 'Administrator' ||
    userMembership?.role === 'Editor';

  // Extract products, milestones, gallery, media
  const products = profile.products || [];
  const milestones = profile.milestones || [];
  const gallery = profile.gallery || [];
  const mediaFeatures = profile.mediaFeatures || [];

  const filteredGallery =
    galleryCategory === 'all'
      ? gallery
      : gallery.filter((item) => item.category === galleryCategory);

  const navTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'about', label: 'About & Story' },
    { id: 'products', label: `Products (${products.length})` },
    { id: 'milestones', label: `Milestones (${milestones.length})` },
    { id: 'team', label: `Team (${members.length})` },
    { id: 'gallery', label: `Gallery (${gallery.length})` },
    { id: 'media', label: `Media (${mediaFeatures.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16">
      {/* ── Top Cover Image Section ── */}
      <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-neutral-900 overflow-hidden">
        {profile.coverImage || orgData.coverImage ? (
          <img
            src={profile.coverImage || orgData.coverImage}
            alt={`${orgData.name} cover`}
            className="w-full h-full object-cover opacity-85"
          />
        ) : (
          <div
            className="w-full h-full opacity-90"
            style={{
              background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 50%, #1A1A2E 100%)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top-right manage button for admins */}
        {canManage && (
          <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
            <Link to={`/organizations/${id}/studio`}>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 shadow-lg backdrop-blur-xs text-xs font-semibold py-2"
              >
                <Edit size={14} /> Admin Profile Studio
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Hero Info & Metadata Section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10">
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-md p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Logo + Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {orgData.logo ? (
                <img
                  src={orgData.logo}
                  alt={orgData.name}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-contain border-2 border-white shadow-md bg-white p-2"
                />
              ) : (
                <div
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold"
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
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                    {orgData.name}
                  </h1>
                  {orgData.status === 'active' && (
                    <Badge variant="success" className="gap-1 text-xs">
                      <ShieldCheck size={13} /> Verified
                    </Badge>
                  )}
                  {profile.companyStage && <Badge variant="gold">{profile.companyStage}</Badge>}
                  <span className="text-xs uppercase font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {orgData.type || 'Company'}
                  </span>
                </div>

                <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mb-3">
                  {profile.tagline || 'Leading innovation within The Golden Circle ecosystem.'}
                </p>

                {/* Sub-meta tags */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                  {orgData.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} className="text-neutral-400" />
                      {orgData.location}
                    </span>
                  )}
                  {profile.industry && (
                    <span className="inline-flex items-center gap-1">
                      <Tag size={13} className="text-neutral-400" />
                      {profile.industry}
                    </span>
                  )}
                  {profile.foundedYear && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} className="text-neutral-400" />
                      Founded {profile.foundedYear}
                    </span>
                  )}
                  {profile.teamSize && (
                    <span className="inline-flex items-center gap-1">
                      <Users size={13} className="text-neutral-400" />
                      {profile.teamSize} Employees
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="sm"
                loading={followLoading}
                onClick={handleFollowToggle}
                className="gap-1.5"
              >
                <Heart size={14} className={isFollowing ? 'fill-red-500 text-red-500' : ''} />
                {isFollowing ? 'Following' : 'Follow'} ({followerCount})
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="gap-1.5 text-neutral-600 hover:text-gray-900"
              >
                <Share2 size={14} /> Share
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setContactModalOpen(true)}
                className="gap-1.5"
              >
                <Mail size={14} /> Contact
              </Button>

              {orgData.website && (
                <a
                  href={orgData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition"
                >
                  <Globe size={13} /> Visit Website <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Sticky Navigation Bar ── */}
        <div className="sticky top-16 z-30 bg-[#FAFAF8]/95 backdrop-blur-md py-2.5 mb-8 border-b border-neutral-200">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-gray-900 hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content Views ── */}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Snapshot Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm text-center sm:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Primary Sector
                </span>
                <span className="text-base font-bold text-gray-900">{profile.industry || 'Technology'}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm text-center sm:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Funding Stage
                </span>
                <span className="text-base font-bold text-gray-900">{profile.companyStage || 'Seed'}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm text-center sm:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Team Members
                </span>
                <span className="text-base font-bold text-gray-900">{members.length || 1} Registered</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm text-center sm:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Followers
                </span>
                <span className="text-base font-bold text-amber-600">{followerCount} Pioneers</span>
              </div>
            </div>

            {/* Story & Problem Statement */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card padding="lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={18} />
                    The Mission
                  </h3>
                  <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-line mb-6">
                    {profile.mission ||
                      profile.description ||
                      `${orgData.name} is dedicated to solving core challenges across ${profile.industry || 'the tech ecosystem'}.`}
                  </p>

                  {profile.problemSolved && (
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                        The Core Problem We Solve
                      </h4>
                      <p className="text-xs text-neutral-700 leading-relaxed">{profile.problemSolved}</p>
                    </div>
                  )}

                  {profile.targetAudience && (
                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Target Audience & Market
                      </h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">{profile.targetAudience}</p>
                    </div>
                  )}
                </Card>

                {/* Products Preview */}
                {products.length > 0 && (
                  <Card padding="lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Box className="text-amber-500" size={18} />
                        Featured Products
                      </h3>
                      <button
                        onClick={() => setActiveTab('products')}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
                      >
                        View all ({products.length}) →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {products.slice(0, 2).map((p) => (
                        <div
                          key={p._id || p.id}
                          className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-amber-300 transition"
                        >
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 inline-block mb-1">
                            {p.category || 'Product'}
                          </span>
                          <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right column: Highlights */}
              <div className="space-y-6">
                <Card padding="lg">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Company Details</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-neutral-100">
                      <span className="text-neutral-500">Headquarters</span>
                      <span className="font-semibold text-gray-900">{orgData.location || 'Global'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-100">
                      <span className="text-neutral-500">Year Founded</span>
                      <span className="font-semibold text-gray-900">{profile.foundedYear || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-100">
                      <span className="text-neutral-500">Entity Structure</span>
                      <span className="font-semibold text-gray-900 capitalize">{orgData.type || 'Company'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-100">
                      <span className="text-neutral-500">Official Website</span>
                      {orgData.website ? (
                        <a
                          href={orgData.website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-amber-600 hover:underline flex items-center gap-1"
                        >
                          Visit ↗
                        </a>
                      ) : (
                        <span className="text-neutral-400">Not provided</span>
                      )}
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-neutral-500">Golden Circle ID</span>
                      <span className="font-mono text-neutral-400">{String(id).slice(-6)}</span>
                    </div>
                  </div>
                </Card>

                {/* Careers Teaser */}
                <Card padding="lg" className="bg-gradient-to-br from-amber-50/60 to-yellow-50/30 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="text-amber-700" size={18} />
                    <h3 className="text-sm font-bold text-amber-900">Career Opportunities</h3>
                  </div>
                  <p className="text-xs text-neutral-600 mb-4">
                    {orgData.name} will be listing internship and full-time engineering & product roles on The Golden Circle.
                  </p>
                  <Badge variant="gold">Coming in Phase 4 Job Pipeline</Badge>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: About & Story */}
        {activeTab === 'about' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <Card padding="lg">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Our Mission & Vision</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                    Mission
                  </span>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {profile.mission || 'To empower the next wave of innovators with scalable infrastructure.'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                    Vision
                  </span>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {profile.vision || 'A seamless, connected global startup ecosystem where talent matches ambition.'}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-3">Full Company Story</h3>
              <div className="text-neutral-700 text-sm leading-relaxed whitespace-pre-line">
                {profile.description ||
                  orgData.description ||
                  'No expanded story has been provided yet for this company profile.'}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Products & Solutions */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {products.length === 0 ? (
              <Card padding="lg" className="text-center py-16">
                <Box className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">No products listed</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  This company has not added software products or service cards to their public showcase.
                </p>
                {canManage && (
                  <Link to={`/organizations/${id}/studio`}>
                    <Button variant="primary" size="sm">
                      Add Products in Studio
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <Card key={p._id || p.id} hover padding="lg" className="flex flex-col justify-between">
                    <div>
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-36 object-cover rounded-xl mb-4 border border-neutral-100"
                        />
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {p.category || 'Product'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">{p.name}</h4>
                      <p className="text-xs text-neutral-600 line-clamp-3 mb-4">{p.description}</p>
                    </div>

                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 pt-3 border-t border-neutral-100"
                      >
                        Explore Product ↗
                      </a>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Milestones & History Timeline */}
        {activeTab === 'milestones' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {milestones.length === 0 ? (
              <Card padding="lg" className="text-center py-16">
                <Milestone className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">No milestones recorded</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  Timeline milestones will document major funding rounds and product breakthroughs.
                </p>
                {canManage && (
                  <Link to={`/organizations/${id}/studio`}>
                    <Button variant="primary" size="sm">
                      Add Milestones in Studio
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              <div className="relative border-l-2 border-amber-200 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-8 py-4">
                {milestones.map((m) => (
                  <div key={m._id || m.id} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-4 w-4 rounded-full border-2 border-amber-500 bg-white" />

                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs hover:border-amber-300 transition">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {m.date || 'Milestone'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">{m.title}</h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Team & Leadership */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {members.length === 0 ? (
              <Card padding="lg" className="text-center py-16">
                <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">No team members visible</h3>
                <p className="text-xs text-neutral-500">Public member directory will update as teammates accept invites.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {members.map((mem) => {
                  const u = mem.user || mem.userId || {};
                  const mInitials = generateInitials(u.fullName || 'Member');

                  return (
                    <div
                      key={mem._id || mem.id}
                      className="bg-white p-5 rounded-2xl border border-neutral-200 flex items-center gap-4 hover:shadow-xs transition"
                    >
                      <div
                        className="h-12 w-12 rounded-xl border-2 flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          borderColor: '#C9A84C',
                          color: '#A07830',
                          backgroundColor: '#FFFDF5',
                        }}
                      >
                        {mInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 text-sm truncate">
                          {u.fullName || 'Team Member'}
                        </div>
                        <div className="text-xs text-amber-800 font-medium">{mem.role || 'Member'}</div>
                        {u.location && (
                          <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1">
                            <MapPin size={10} /> {u.location}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Photo Gallery with Lightbox */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Gallery Category filter */}
            {gallery.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['all', 'team', 'office', 'product', 'event'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGalleryCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                      galleryCategory === cat
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filteredGallery.length === 0 ? (
              <Card padding="lg" className="text-center py-16">
                <Sparkles className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">No photos in gallery</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  Add photos of your HQ, team retreats, and product demonstrations.
                </p>
                {canManage && (
                  <Link to={`/organizations/${id}/studio`}>
                    <Button variant="primary" size="sm">
                      Upload Photos in Studio
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredGallery.map((img, idx) => (
                  <div
                    key={img._id || img.id || idx}
                    onClick={() => {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                    className="relative group rounded-2xl overflow-hidden aspect-video bg-neutral-900 cursor-pointer shadow-xs border border-neutral-200"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || 'Company photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition p-3 flex flex-col justify-between text-white">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/20 self-start">
                        {img.category || 'Culture'}
                      </span>
                      {img.caption && <span className="text-xs font-medium truncate">{img.caption}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Press & Media */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {mediaFeatures.length === 0 ? (
              <Card padding="lg" className="text-center py-16">
                <Newspaper className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">No press features yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  Link media coverage, founder podcasts, and video demos here.
                </p>
                {canManage && (
                  <Link to={`/organizations/${id}/studio`}>
                    <Button variant="primary" size="sm">
                      Add Media in Studio
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mediaFeatures.map((m) => (
                  <Card key={m._id || m.id} hover padding="lg" className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {m.type || 'Press'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{m.title}</h4>
                      {m.publisher && <p className="text-xs text-neutral-400 mb-3">{m.publisher}</p>}
                    </div>

                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 pt-3 border-t border-neutral-100"
                    >
                      Read Feature ↗
                    </a>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox Component ── */}
      <Lightbox
        images={filteredGallery}
        activeIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={(idx) => setLightboxIndex(idx)}
      />

      {/* ── Share Modal ── */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        companyName={orgData.name}
      />

      {/* ── Contact Modal ── */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        companyName={orgData.name}
        contactInfo={profile.contactInfo}
        website={orgData.website}
      />
    </div>
  );
}
