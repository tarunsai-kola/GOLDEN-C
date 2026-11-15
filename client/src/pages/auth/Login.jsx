import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusNotice, setStatusNotice] = useState(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError(null);
    if (statusNotice) setStatusNotice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatusNotice(null);
    setLoading(true);

    try {
      const res = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

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
      if (err.status === 403 && err.message?.toLowerCase().includes('suspended')) {
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

  return (
    <div className="w-full max-w-md mx-auto py-4">
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
