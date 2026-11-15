import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Settings,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  Edit3,
  LogOut,
  Mail,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import organizationService from '../../services/organization.service';
import { useOrganization } from '../../context/OrganizationContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { generateInitials } from '../../utils/helpers';

export default function OrgDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshMyOrganizations } = useOrganization();

  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fetchOrgData = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgRes = await organizationService.getById(id);
        const orgData = orgRes.organization || orgRes;
        setOrganization(orgData);

        // Fetch members
        try {
          const memRes = await organizationService.getMembers(id);
          setMembers(Array.isArray(memRes) ? memRes : memRes.members || []);
        } catch (memErr) {
          console.warn('Could not load members:', memErr);
        }

        // Fetch invitations if owner/admin
        try {
          const invRes = await organizationService.getInvitations(id);
          setInvitations(Array.isArray(invRes) ? invRes : invRes.invitations || []);
        } catch {
          // Non-admins cannot view invitations
          setInvitations([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrgData();
  }, [id]);

  const handleLeaveOrg = async () => {
    if (
      !window.confirm(
        'Are you sure you want to leave this organization? You will lose access to team workspaces and settings.'
      )
    ) {
      return;
    }

    setLeaving(true);
    try {
      await organizationService.leave(id);
      await refreshMyOrganizations();
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Unable to leave organization.');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading company workspace...</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
        <p className="text-neutral-600 mb-6">{error || 'Organization not found or you lack permission.'}</p>
        <Link to="/dashboard">
          <Button variant="primary" size="md">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const profile = organization.companyProfile || organization.profile || {};
  const initials = generateInitials(organization.name);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Workspace Header */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="h-16 w-16 rounded-2xl object-contain border border-neutral-200 bg-white p-1.5"
              />
            ) : (
              <div
                className="h-16 w-16 rounded-2xl border-2 flex items-center justify-center text-xl font-bold"
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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                <Badge variant="gold">Company Hub</Badge>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500">
                {profile.tagline || 'Manage your company identity, team roster, and ecosystem presence.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/organizations/${id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ExternalLink size={14} /> View Public Profile
              </Button>
            </Link>
            <Link to={`/organizations/${id}/studio`}>
              <Button variant="primary" size="sm" className="gap-1.5">
                <Sparkles size={14} /> Profile Studio
              </Button>
            </Link>
            <Link to={`/organizations/${id}/members`}>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Users size={14} /> Manage Team
              </Button>
            </Link>
            <Link to={`/organizations/${id}/settings`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Settings size={14} /> Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Members
            </span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{members.length}</div>
          <span className="text-[11px] text-neutral-400">Active collaborators</span>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Pending Invites
            </span>
            <Mail className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{invitations.length}</div>
          <span className="text-[11px] text-neutral-400">Awaiting acceptance</span>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Verification
            </span>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-lg font-bold text-gray-900 capitalize">
            {organization.status || 'Active'}
          </div>
          <span className="text-[11px] text-green-600 font-medium">Verified Profile</span>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Stage
            </span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-gray-900">
            {profile.companyStage || 'Seed'}
          </div>
          <span className="text-[11px] text-neutral-400">{profile.industry || 'Technology'}</span>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Team & Invites Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Team Members</h3>
                <p className="text-xs text-neutral-500">
                  Colleagues and founders with assigned platform roles
                </p>
              </div>
              <Link to={`/organizations/${id}/members`}>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <UserPlus size={14} /> Invite
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {members.slice(0, 5).map((mem) => {
                const u = mem.user || mem.userId || {};
                const mInitials = generateInitials(u.fullName || 'Member');
                return (
                  <div
                    key={mem._id || mem.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-full border flex items-center justify-center font-bold text-xs"
                        style={{
                          borderColor: '#C9A84C',
                          color: '#A07830',
                          backgroundColor: '#FFFDF5',
                        }}
                      >
                        {mInitials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {u.fullName || 'Member'}
                        </div>
                        <div className="text-xs text-neutral-500">{u.email}</div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      {mem.role}
                    </span>
                  </div>
                );
              })}
            </div>

            {members.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  to={`/organizations/${id}/members`}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  View all {members.length} members →
                </Link>
              </div>
            )}
          </Card>

          {/* Ecosystem Pipeline Roadmap */}
          <Card padding="lg">
            <h3 className="font-bold text-gray-900 text-base mb-2">
              Next-Gen Ecosystem Features
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Your company will unlock upcoming Golden Circle superpowers:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="text-xs font-bold text-amber-900 mb-1">
                  Phase 4: Job & Talent Pipeline
                </div>
                <p className="text-xs text-neutral-600">
                  Publish openings, review applicant profiles, and schedule interviews.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                <div className="text-xs font-bold text-purple-900 mb-1">
                  Phase 5: Pitch & Demo Days
                </div>
                <p className="text-xs text-neutral-600">
                  Host virtual demo days and connect directly with vetted angel investors.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Actions & Danger Zone */}
        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Quick Navigation</h3>
            <div className="space-y-2">
              <Link
                to={`/organizations/${id}/studio`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition text-sm text-neutral-700"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles size={15} className="text-amber-500" /> Admin Profile Studio
                </span>
                <ChevronRight size={14} className="text-neutral-400" />
              </Link>
              <Link
                to={`/organizations/${id}/settings`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition text-sm text-neutral-700"
              >
                <span className="flex items-center gap-2.5">
                  <Edit3 size={15} className="text-neutral-500" /> Basic Settings
                </span>
                <ChevronRight size={14} className="text-neutral-400" />
              </Link>
              <Link
                to={`/organizations/${id}/members`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition text-sm text-neutral-700"
              >
                <span className="flex items-center gap-2.5">
                  <UserPlus size={15} className="text-blue-500" /> Team Invitations
                </span>
                <ChevronRight size={14} className="text-neutral-400" />
              </Link>
              <Link
                to={`/organizations/${id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition text-sm text-neutral-700"
              >
                <span className="flex items-center gap-2.5">
                  <ExternalLink size={15} className="text-green-500" /> Preview Public Page
                </span>
                <ChevronRight size={14} className="text-neutral-400" />
              </Link>
            </div>
          </Card>

          <Card padding="lg" className="border-red-100 bg-red-50/20">
            <h3 className="font-bold text-red-900 text-sm mb-1">Membership Actions</h3>
            <p className="text-xs text-neutral-600 mb-4">
              Need to leave this company roster? Non-owners can exit freely; owners must transfer ownership first.
            </p>
            <Button
              variant="danger"
              size="sm"
              loading={leaving}
              onClick={handleLeaveOrg}
              className="w-full justify-center gap-2"
            >
              <LogOut size={14} /> Leave Organization
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
