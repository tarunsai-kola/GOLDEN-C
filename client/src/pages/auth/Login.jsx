import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

export default function Login() {
  const { login, reactivateAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [error, setError] = useState(null);
  const [statusNotice, setStatusNotice] = useState(location.state?.notice ? { type: 'info', message: location.state.notice } : null);
  const [deactivatedInfo, setDeactivatedInfo] = useState(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError(null);
    if (statusNotice) setStatusNotice(null);
    if (deactivatedInfo) setDeactivatedInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatusNotice(null);
    setDeactivatedInfo(null);
    setLoading(true);

    try {
      const res = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (res.requiresReactivation || res.isDeactivated) {
        setDeactivatedInfo({
          email: formData.email.trim(),
          password: formData.password,
          fullName: res.user?.fullName,
        });
        return;
      }

      if (res.user?.status === 'suspended') {
        setStatusNotice({
          type: 'suspended',
          message: 'Your account is currently suspended. Please contact support.',
        });
        return;
      }

      if (res.user?.status === 'pending') {
        setStatusNotice({
          type: 'pending',
          message: 'Please verify your email to unlock all Golden Circle features.',
        });
      }

      navigate(from, { replace: true });
    } catch (err) {
      if (err.data?.requiresReactivation || err.data?.isDeactivated) {
        setDeactivatedInfo({
          email: formData.email.trim(),
          password: formData.password,
          fullName: err.data?.user?.fullName,
        });
      } else if (err.status === 403 && err.message?.toLowerCase().includes('suspended')) {
        setError('Your account has been suspended. Please contact support@thegoldencircle.io');
      } else if (err.status === 401 || err.status === 400) {
        setError(err.message || 'Invalid email or password');
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!deactivatedInfo) return;
    setReactivating(true);
    setError(null);

    try {
      await reactivateAccount({
        email: deactivatedInfo.email,
        password: deactivatedInfo.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to reactivate account. Please verify your password.');
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-4">
      {/* Mobile brand header */}
      <div className="lg:hidden text-center mb-6">
        <Link to="/" className="inline-flex flex-col items-center gap-2">
          <img
            src="/logo.png"
            alt="The Golden Circle"
            className="w-16 h-16 rounded-full object-cover border-2 border-amber-400/50 shadow-md"
          />
          <span className="font-bold text-gray-900 text-sm tracking-wide">The Golden Circle</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Welcome Back
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Sign in to access your Golden Circle workspace
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {statusNotice && (
        <div className={`mb-5 p-3.5 rounded-xl border text-sm flex items-start gap-2.5 ${
          statusNotice.type === 'suspended'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {statusNotice.type === 'suspended' ? (
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {deactivatedInfo && (
        <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Account is currently deactivated
              </h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Welcome back{deactivatedInfo.fullName ? `, ${deactivatedInfo.fullName}` : ''}! Your profile, venture ideas, and events were hidden when you deactivated your account. Nothing was deleted.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={reactivating}
              onClick={handleReactivate}
              className="flex-1 justify-center font-bold"
            >
              Reactivate My Account
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeactivatedInfo(null)}
              className="text-neutral-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-amber-600 focus:ring-amber-400 border-neutral-300 rounded cursor-pointer"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-xs text-neutral-600 cursor-pointer">
            Remember me on this device
          </label>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full justify-center text-sm py-3"
          >
            Sign In
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs sm:text-sm text-neutral-600">
        Don’t have an account?{' '}
        <Link to="/register" className="font-semibold text-amber-600 hover:text-amber-700">
          Get Started
        </Link>
      </div>
    </div>
  );
}
