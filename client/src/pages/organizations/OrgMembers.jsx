import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  X,
} from 'lucide-react';
import organizationService from '../../services/organization.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { generateInitials } from '../../utils/helpers';

export default function OrgMembers() {
  const { id } = useParams();
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  const roles = [
    'Administrator',
    'Editor',
    'Recruiter',
    'Event Manager',
    'Member',
  ];

  const fetchMembersAndInvites = async () => {
    setLoading(true);
    setError(null);
    try {
      const [memData, invData] = await Promise.allSettled([
        organizationService.getMembers(id),
        organizationService.getInvitations(id),
      ]);

      if (memData.status === 'fulfilled') {
        setMembers(
          Array.isArray(memData.value)
            ? memData.value
            : memData.value.members || []
        );
      } else {
        setError('Failed to fetch team members');
      }

      if (invData.status === 'fulfilled') {
        setInvitations(
          Array.isArray(invData.value)
            ? invData.value
            : invData.value.invitations || []
        );
      } else {
        setInvitations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMembersAndInvites();
  }, [id]);

  const currentMember = members.find(
    (m) => (m.user?._id || m.userId || m.user?.id) === (user?._id || user?.id)
  );
  const currentRole = currentMember?.role || 'Member';
  const isOwner = currentRole === 'Owner';
  const isAdmin = isOwner || currentRole === 'Administrator';

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);

    try {
      await organizationService.inviteMember(id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setSuccessMsg(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('Member');
      await fetchMembersAndInvites();
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (invitationId) => {
    if (!window.confirm('Cancel this pending invitation?')) return;
    try {
      await organizationService.cancelInvitation(id, invitationId);
      setSuccessMsg('Invitation canceled successfully');
      setInvitations((prev) => prev.filter((i) => (i._id || i.id) !== invitationId));
    } catch (err) {
      alert(err.message || 'Failed to cancel invitation');
    }
  };

  const handleRoleChange = async (membershipId, newRole) => {
    try {
      await organizationService.updateMemberRole(id, membershipId, newRole);
      setSuccessMsg('Member role updated successfully');
      setMembers((prev) =>
        prev.map((m) =>
          (m._id || m.id) === membershipId ? { ...m, role: newRole } : m
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (membershipId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this organization?`)) {
      return;
    }

    try {
      await organizationService.removeMember(id, membershipId);
      setSuccessMsg(`${memberName} was removed from the team`);
      setMembers((prev) => prev.filter((m) => (m._id || m.id) !== membershipId));
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to={`/organizations/${id}/dashboard`}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-amber-600 mb-2 transition"
          >
            <ArrowLeft size={13} /> Back to Company Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Team & Members
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage organization collaborators, permissions, and invitations
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowInviteModal(true)}
            className="gap-2 self-start sm:self-auto"
          >
            <UserPlus size={16} /> Invite Member
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Active Members Table */}
      <Card padding="none" className="overflow-hidden mb-10 border-neutral-200">
        <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Users size={18} className="text-amber-600" />
            Active Team Members ({members.length})
          </h2>
        </div>

        <div className="divide-y divide-neutral-200 overflow-x-auto">
          {members.map((mem) => {
            const u = mem.user || mem.userId || {};
            const memId = mem._id || mem.id;
            const isTargetOwner = mem.role === 'Owner';
            const isTargetAdmin = mem.role === 'Administrator';
            const isSelf = (u._id || u.id) === (user?._id || user?.id);
            const initials = generateInitials(u.fullName || 'Member');

            // Permissions to edit role or remove
            const canChangeThisRole =
              isOwner ? !isTargetOwner || isSelf : isAdmin && !isTargetOwner && !isTargetAdmin;
            const canRemoveThisMember =
              isOwner ? !isTargetOwner : isAdmin && !isTargetOwner && !isTargetAdmin;

            return (
              <div
                key={memId}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="h-10 w-10 rounded-full border flex items-center justify-center font-bold text-xs"
                    style={{
                      borderColor: '#C9A84C',
                      color: '#A07830',
                      backgroundColor: '#FFFDF5',
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {u.fullName || 'User'}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500">{u.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  {canChangeThisRole ? (
                    <select
                      value={mem.role}
                      onChange={(e) => handleRoleChange(memId, e.target.value)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      {isOwner && <option value="Owner">Owner</option>}
                    </select>
                  ) : (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {mem.role}
                    </span>
                  )}

                  {canRemoveThisMember && (
                    <button
                      onClick={() => handleRemoveMember(memId, u.fullName || 'Member')}
                      title="Remove member"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pending Invitations Section */}
      {isAdmin && (
        <Card padding="none" className="overflow-hidden border-neutral-200">
          <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Mail size={18} className="text-blue-600" />
              Pending Invitations ({invitations.length})
            </h2>
          </div>

          {invitations.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No pending invitations. Use the "Invite Member" button to invite colleagues.
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {invitations.map((inv) => (
                <div
                  key={inv._id || inv.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{inv.email}</div>
                      <div className="text-xs text-neutral-500">
                        Invited as <span className="font-medium text-gray-700">{inv.role}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvite(inv._id || inv.id)}
                    className="text-red-600 hover:bg-red-50 text-xs self-end sm:self-auto"
                  >
                    Cancel Invitation
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <UserPlus className="text-amber-500" size={18} />
              Invite Team Member
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Send an invitation link with a defined role to join your company.
            </p>

            {inviteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Colleague's Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Assigned Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Administrators can edit profiles & invite; Editors update details; Members have read access.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={inviting}
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
