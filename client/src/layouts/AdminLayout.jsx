import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Briefcase,
  FileText,
  ShieldAlert,
  Sliders,
  BarChart3,
  ScrollText,
  ArrowLeft,
  ShieldCheck,
  Bell,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/admin.service';
import Button from '../components/ui/Button';
import { generateInitials } from '../utils/helpers';

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [metrics, setMetrics] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        const res = await adminService.getMetrics();
        if (res) setMetrics(res);
      } catch {
        // Ignore
      }
    };
    loadTelemetry();
  }, [location.pathname]);

  const navItems = [
    { to: '/admin', label: 'Console Overview', icon: LayoutDashboard, exact: true },
    { to: '/admin/users', label: 'User Governance', icon: Users },
    {
      to: '/admin/organizations',
      label: 'Venture Verification',
      icon: Building2,
      badge: metrics?.pendingVerifications,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      to: '/admin/events',
      label: 'Events Moderation',
      icon: Calendar,
      badge: metrics?.pendingEvents,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    { to: '/admin/jobs', label: 'Jobs & Careers', icon: Briefcase },
    { to: '/admin/cms', label: 'Editorial & CMS', icon: FileText },
    {
      to: '/admin/moderation',
      label: 'Trust & Safety',
      icon: ShieldAlert,
      badge: metrics?.pendingReports,
      badgeColor: 'bg-red-100 text-red-800',
    },
    { to: '/admin/config', label: 'Platform Settings', icon: Sliders },
    { to: '/admin/analytics', label: 'Telemetry & Growth', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: ScrollText },
  ];

  const initials = generateInitials(user?.fullName || 'Admin');

  return (
    <div className="min-h-screen bg-neutral-100/60 flex">
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/50 lg:hidden backdrop-blur-2xs"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-charcoal text-white flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand & Console Title */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-xs"
                style={{ borderColor: '#C9A84C', color: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)' }}
              >
                GC
              </div>
              <div>
                <span className="font-bold text-sm tracking-wide text-white block">
                  The Golden Circle
                </span>
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Control Center
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {Boolean(item.badge) && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Info & Return Button */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-neutral-900/40">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-xs text-amber-400">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white truncate block">{user?.fullName || 'Super Administrator'}</span>
              <span className="text-[10px] text-amber-400/90 capitalize block">Platform Admin</span>
            </div>
          </div>

          <Link to="/dashboard" className="block">
            <button className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition border border-white/5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Platform
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Administrative Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-charcoal capitalize">
                {location.pathname.split('/')[2] || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Governance
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
