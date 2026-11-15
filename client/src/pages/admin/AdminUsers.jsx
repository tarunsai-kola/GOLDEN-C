import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  MoreVertical,
  Mail,
  Building2,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatters';
import { generateInitials } from '../../utils/helpers';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await adminService.getUsers(params);
      const list = Array.isArray(res) ? res : res.users || [];
      setUsers(list);
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const reason = window.prompt(`Enter reason for ${nextStatus === 'suspended' ? 'suspending' : 'reactivating'} this user:`, '');
    if (reason === null) return;

    setActionLoading(userId);
    try {
      await adminService.updateUserStatus(userId, nextStatus, reason);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${nextRole.toUpperCase()}?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      await adminService.updateUserRole(userId, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: nextRole } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <Users className="w-4 h-4 text-amber-600" /> User Governance
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Member Directory & Access Roles</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage executive accounts, assign platform governance roles, and enforce security suspensions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by full name, email, or headline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Roles</option>
            <option value="user">Members (Users)</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <span className="text-xs text-neutral-500">Querying user database...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 text-neutral-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No users matching search filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Member</th>
                  <th className="py-4 px-6">Email & Status</th>
                  <th className="py-4 px-6">Platform Role</th>
                  <th className="py-4 px-6">Registered</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((u) => {
                  const initials = generateInitials(u.fullName || 'User');
                  const isSuspended = u.status === 'suspended';
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u._id || u.id} className="hover:bg-neutral-50/50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.fullName}
                              className="w-9 h-9 rounded-xl object-cover border border-neutral-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-bold flex items-center justify-center">
                              {initials}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-charcoal block">{u.fullName || 'Unknown'}</span>
                            <span className="text-[11px] text-neutral-400 block truncate max-w-xs">
                              {u.headline || u.title || 'Platform Member'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-charcoal font-mono">{u.email}</div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSuspended
                                ? 'bg-red-100 text-red-800'
                                : u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {u.status || 'Active'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-amber-600" /> Admin
                            </>
                          ) : (
                            'Member'
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-neutral-500">
                        {u.createdAt ? formatDate(u.createdAt) : '—'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Role Toggle Button */}
                          <button
                            disabled={actionLoading === u._id}
                            onClick={() => handleRoleToggle(u._id, u.role)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg text-neutral-600 hover:bg-neutral-100 transition"
                            title={isAdmin ? 'Demote to regular member' : 'Promote to platform admin'}
                          >
                            {isAdmin ? 'Make User' : 'Make Admin'}
                          </button>

                          {/* Status Toggle (Suspend / Reactivate) */}
                          <Button
                            size="sm"
                            variant={isSuspended ? 'secondary' : 'ghost'}
                            loading={actionLoading === u._id}
                            onClick={() => handleStatusToggle(u._id, u.status)}
                            className={`text-xs px-2.5 py-1 ${
                              isSuspended ? 'text-emerald-700 border-emerald-300' : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {isSuspended ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> Reactivate
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Suspend
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
