import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function VerifyAccount() {
  const { verifyAccount, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [tokenInput, setTokenInput] = useState(tokenFromUrl || '');
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const hasAutoExecuted = useRef(false);

  const executeVerification = async (tok) => {
    if (!tok) {
      setStatus('error');
      setErrorMessage('Verification token is missing. Please check your verification link.');
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      await verifyAccount(tok.trim());
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err.message || 'Verification token is invalid or has expired. Please request a new one.'
      );
    }
  };

  useEffect(() => {
    if (tokenFromUrl && !hasAutoExecuted.current) {
      hasAutoExecuted.current = true;
      executeVerification(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  return (
    <div className="w-full max-w-md mx-auto text-center py-6">
      {status === 'verifying' && (
        <div>
          <div className="flex justify-center mb-6">
            <Spinner size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Account</h2>
          <p className="text-sm text-neutral-600">
            Please wait while we validate your security credentials...
          </p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Account Verified!
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 mb-8">
            Your email has been successfully verified. Your Golden Circle membership is now active.
          </p>
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Proceed to Sign In'}
            <ArrowRight size={16} />
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6 text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-sm text-neutral-600 mb-6">{errorMessage}</p>

          <div className="space-y-4 text-left bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Manual Token Entry
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste verification token here"
              className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              onClick={() => executeVerification(tokenInput)}
            >
              Verify Token
            </Button>
          </div>

          <Link to="/login" className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-medium">
            Return to Sign In
          </Link>
        </div>
      )}

      {status === 'idle' && !tokenFromUrl && (
        <div>
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6 text-amber-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verification</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Enter the verification token provided in your email confirmation.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeVerification(tokenInput);
            }}
            className="space-y-4"
          >
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter your verification token"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-center"
            />
            <Button type="submit" variant="primary" size="md" className="w-full justify-center">
              Verify Account
            </Button>
          </form>

          <div className="mt-6">
            <Link to="/login" className="text-xs sm:text-sm text-neutral-600 hover:text-amber-600">
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
