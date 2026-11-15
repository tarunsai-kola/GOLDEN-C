import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6 text-amber-600">
          <Mail className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Instructions Sent</h2>
        <p className="text-neutral-600 mb-6 text-sm sm:text-base">
          If an account exists for <span className="font-semibold text-gray-900">{email}</span>, we have sent a password reset link.
        </p>
        <p className="text-xs text-neutral-500 mb-8 max-w-sm mx-auto">
          Please check your inbox (and spam folder) and click the link within 1 hour to reset your password.
        </p>
        <div className="space-y-3">
          <Link to="/login" className="block">
            <Button variant="primary" size="md" className="w-full justify-center">
              Return to Sign In
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
            }}
            className="text-xs text-neutral-500 hover:text-amber-600 transition"
          >
            Didn’t receive the link? Try another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto py-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Reset Password
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Enter your registered email and we’ll send you recovery instructions
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full justify-center text-sm py-3"
          >
            Send Reset Instructions
            <Send size={15} />
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 hover:text-amber-600 transition"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
