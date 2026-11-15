import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MailCheck,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Clock,
} from 'lucide-react';
import organizationService from '../../services/organization.service';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { refreshMyOrganizations, switchOrganization } = useOrganization();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [actionDone, setActionDone] = useState(null); // 'accepted' | 'rejected'

  useEffect(() => {
    const fetchInviteDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await organizationService.getInvitationByToken(token);
        setInvitation(data.invitation || data);
      } catch (err) {
        setError(err.message || 'Invitation is invalid, expired, or has already been used.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchInviteDetails();
  }, [token]);

  const handleAccept = async () => {
    setProcessing(true);
    setError(null);
    try {
      const result = await organizationService.acceptInvitation(token);
      setActionDone('accepted');
      await refreshMyOrganizations();
      const orgId =
        result?.membership?.organizationId ||
        invitation?.organization?._id ||
        invitation?.organizationId;
      if (orgId) {
        switchOrganization(orgId);
      }
    } catch (err) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) return;
    setProcessing(true);
    setError(null);
    try {
      await organizationService.rejectInvitation(token);
      setActionDone('rejected');
    } catch (err) {
      setError(err.message || 'Failed to reject invitation.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Checking invitation details...</p>
      </div>
    );
  }

  if (actionDone === 'accepted') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6 text-green-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h2>
        <p className="text-sm text-neutral-600 mb-8">
          You have successfully joined{' '}
          <span className="font-semibold text-gray-900">
            {invitation?.organization?.name || 'the organization'}
          </span>
          .
        </p>
        <Button
          variant="primary"
          size="md"
          className="w-full justify-center"
          onClick={() => {
            const orgId =
              invitation?.organization?._id || invitation?.organizationId;
            navigate(orgId ? `/organizations/${orgId}/dashboard` : '/dashboard');
          }}
        >
          Go to Company Dashboard <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  if (actionDone === 'rejected') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6 text-neutral-500">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Declined</h2>
        <p className="text-sm text-neutral-600 mb-8">
          You have declined this organization invitation.
        </p>
        <Link to="/dashboard">
          <Button variant="secondary" size="md" className="w-full justify-center">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6 text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
        <p className="text-sm text-neutral-600 mb-8">
          {error || 'This invitation link is not valid or has expired.'}
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="md" className="w-full justify-center">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const orgName = invitation.organization?.name || 'an Organization';
  const roleName = invitation.role || 'Member';

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-600">
          <Building2 className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You're Invited to Join
        </h1>
        <h2 className="text-xl font-bold text-amber-700 mb-4">{orgName}</h2>

        <p className="text-sm text-neutral-600 mb-6">
          You have been invited to collaborate as a{' '}
          <span className="font-semibold text-gray-900 px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
            {roleName}
          </span>
          .
        </p>

        {!isAuthenticated ? (
          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 mb-6 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Account Required
            </h4>
            <p className="text-xs text-neutral-600 mb-4">
              Please sign in or create your Golden Circle account to accept this invitation.
            </p>
            <div className="flex gap-2">
              <Link
                to="/login"
                state={{ from: { pathname: `/invitations/${token}` } }}
                className="flex-1"
              >
                <Button variant="primary" size="sm" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link
                to="/register"
                state={{ from: { pathname: `/invitations/${token}` } }}
                className="flex-1"
              >
                <Button variant="secondary" size="sm" className="w-full justify-center">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="md"
              loading={processing}
              onClick={handleAccept}
              className="w-full justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Accept Invitation
            </Button>
            <Button
              variant="ghost"
              size="md"
              disabled={processing}
              onClick={handleReject}
              className="w-full justify-center text-neutral-500 hover:text-red-600"
            >
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
