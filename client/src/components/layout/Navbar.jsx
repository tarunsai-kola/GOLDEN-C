import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Building2,
  ChevronDown,
  PlusCircle,
  Compass,
  Calendar,
  Briefcase,
  Users,
  MessageSquare,
  ShieldCheck,
  Check,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useChat } from '../../context/ChatContext';
import Button from '../ui/Button';
import NotificationCenter from '../notifications/NotificationCenter';
import { generateInitials } from '../../utils/helpers';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useChat();
  const {
    myOrganizations,
    activeOrgId,
    activeOrganization,
    switchOrganization,
  } = useOrganization();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMobileOpen(false);
    navigate('/');
  };

  const initials = generateInitials(user?.fullName || 'User');

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 bg-white transition-shadow duration-200 ${
        isScrolled ? 'shadow-md' : 'border-b border-neutral-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
              style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
            >
              GC
            </div>
            <span className="font-bold text-lg text-gray-900 hidden sm:block">
              The Golden Circle
            </span>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/discover"
              className="px-3 py-1.5 rounded-xl text-sm font-semibold text-neutral-700 hover:text-amber-800 hover:bg-amber-50/60 transition flex items-center gap-1.5"
            >
              <Compass size={16} className="text-amber-600" /> Discover Startups
            </Link>
            <Link
              to="/events"
              className="px-3 py-1.5 rounded-xl text-sm font-semibold text-neutral-700 hover:text-amber-800 hover:bg-amber-50/60 transition flex items-center gap-1.5"
            >
              <Calendar size={15} className="text-amber-600" /> Events & Webinars
            </Link>
            <Link
              to="/jobs"
              className="px-3 py-1.5 rounded-xl text-sm font-semibold text-neutral-700 hover:text-amber-800 hover:bg-amber-50/60 transition flex items-center gap-1.5"
            >
              <Briefcase size={15} className="text-amber-600" /> Jobs & Careers
            </Link>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Organization Quick Selector */}
              {myOrganizations.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition"
                  >
                    <Building2 size={13} className="text-amber-600" />
                    <span className="max-w-[120px] truncate">
                      {activeOrganization?.name || 'My Companies'}
                    </span>
                    <ChevronDown size={13} className="text-neutral-400" />
                  </button>

                  {isOrgDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                        Your Organizations
                      </div>
                      {myOrganizations.map((item) => {
                        const org = item.organization || item;
                        const orgId = org._id || org.id;
                        const isSelected = orgId === activeOrgId;

                        return (
                          <button
                            key={orgId}
                            onClick={() => {
                              switchOrganization(orgId);
                              setIsOrgDropdownOpen(false);
                              navigate(`/organizations/${orgId}/dashboard`);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50/50 transition ${
                              isSelected ? 'font-semibold text-amber-900 bg-amber-50/30' : 'text-neutral-700'
                            }`}
                          >
                            <span className="truncate">{org.name}</span>
                            {isSelected && <Check size={14} className="text-amber-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                      <div className="my-1 border-t border-neutral-100" />
                      <Link
                        to="/organizations/new"
                        onClick={() => setIsOrgDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-neutral-50 flex items-center gap-1.5 font-medium"
                      >
                        <PlusCircle size={14} /> Register New Startup
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <Link to="/network">
                <Button variant="ghost" size="sm" className="gap-1.5 text-neutral-700">
                  <Users size={15} className="text-amber-600" />
                  Network
                </Button>
              </Link>

              <Link to="/messages" className="relative">
                <Button variant="ghost" size="sm" className="gap-1.5 text-neutral-700">
                  <MessageSquare size={15} className="text-amber-600" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-1 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              <NotificationCenter />

              <Link to="/profile" title="Your Founder Profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <div
                    className="h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-bold"
                    style={{
                      borderColor: '#C9A84C',
                      color: '#A07830',
                      backgroundColor: '#FFFDF5',
                    }}
                  >
                    {initials}
                  </div>
                  <span className="font-medium text-neutral-800">
                    {user?.fullName?.split(' ')[0] || 'Profile'}
                  </span>
                </Button>
              </Link>

              <Link to="/dashboard">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <LayoutDashboard size={14} />
                  Dashboard
                </Button>
              </Link>

              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="secondary" size="sm" className="gap-1.5 border-amber-300 bg-amber-50/50 text-amber-900 font-bold">
                    <ShieldCheck size={14} className="text-amber-600" />
                    Admin
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-neutral-500 hover:text-red-600 gap-1.5"
              >
                <LogOut size={14} />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200 px-4 py-4 flex flex-col gap-2 shadow-lg">
          <Link
            to="/discover"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-semibold text-neutral-800"
          >
            <Compass size={16} className="text-amber-600" />
            Discover Startups
          </Link>
          <Link
            to="/events"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-semibold text-neutral-800"
          >
            <Calendar size={16} className="text-amber-600" />
            Events & Webinars
          </Link>
          <Link
            to="/jobs"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-semibold text-neutral-800"
          >
            <Briefcase size={16} className="text-amber-600" />
            Jobs & Careers
          </Link>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5 my-1 bg-neutral-50 rounded-xl">
                <div
                  className="h-9 w-9 rounded-full border flex items-center justify-center text-xs font-bold"
                  style={{
                    borderColor: '#C9A84C',
                    color: '#A07830',
                    backgroundColor: '#FFFDF5',
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {user?.fullName}
                  </div>
                  <div className="text-xs text-neutral-500">{user?.email}</div>
                </div>
              </div>

              {myOrganizations.length > 0 && (
                <div className="space-y-1 py-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-2">
                    My Organizations
                  </div>
                  {myOrganizations.map((item) => {
                    const org = item.organization || item;
                    const orgId = org._id || org.id;
                    return (
                      <Link
                        key={orgId}
                        to={`/organizations/${orgId}/dashboard`}
                        onClick={() => {
                          switchOrganization(orgId);
                          setIsMobileOpen(false);
                        }}
                        className="flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-neutral-100 text-neutral-700"
                      >
                        <span className="truncate">{org.name}</span>
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {item.role || 'Member'}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <Link
                to="/organizations/new"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-amber-700 hover:bg-amber-50"
              >
                <PlusCircle size={15} /> Register New Startup
              </Link>

              <Link
                to="/network"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-semibold text-neutral-800"
              >
                <Users size={16} className="text-amber-600" />
                Network
              </Link>
              <Link
                to="/messages"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-semibold text-neutral-800"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-amber-600" />
                  Direct Messages
                </div>
                {unreadCount > 0 && (
                  <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 font-bold text-sm border border-amber-200"
                >
                  <ShieldCheck size={16} className="text-amber-600" />
                  Executive Admin Console
                </Link>
              )}

              <Link
                to="/profile"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-semibold text-neutral-800"
              >
                <User size={16} className="text-amber-600" />
                Your Founder Profile
              </Link>

              <Link to="/dashboard" onClick={() => setIsMobileOpen(false)}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center gap-2 mt-2"
                >
                  <LayoutDashboard size={16} />
                  Go to Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-red-600 hover:bg-red-50 gap-2"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileOpen(false)}>
                <Button variant="primary" size="sm" className="w-full justify-center">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
