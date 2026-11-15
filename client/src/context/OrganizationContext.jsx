import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import organizationService from '../services/organization.service';
import { useAuth } from './AuthContext';

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [myOrganizations, setMyOrganizations] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(() => {
    return localStorage.getItem('gc_active_org') || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshMyOrganizations = useCallback(async () => {
    if (!isAuthenticated) {
      setMyOrganizations([]);
      setActiveOrgId(null);
      localStorage.removeItem('gc_active_org');
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.getMyOrganizations();
      const list = Array.isArray(data) ? data : data?.organizations || [];
      setMyOrganizations(list);

      // If activeOrgId is not set or not in list, default to first organization
      if (list.length > 0) {
        const found = list.find((item) => (item.organization?._id || item._id) === activeOrgId);
        if (!found) {
          const firstId = list[0].organization?._id || list[0]._id;
          setActiveOrgId(firstId);
          localStorage.setItem('gc_active_org', firstId);
        }
      } else {
        setActiveOrgId(null);
        localStorage.removeItem('gc_active_org');
      }

      return list;
    } catch (err) {
      setError(err.message || 'Failed to fetch organizations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeOrgId]);

  useEffect(() => {
    refreshMyOrganizations();
  }, [isAuthenticated]);

  const switchOrganization = useCallback((orgId) => {
    setActiveOrgId(orgId);
    if (orgId) {
      localStorage.setItem('gc_active_org', orgId);
    } else {
      localStorage.removeItem('gc_active_org');
    }
  }, []);

  const activeMembership = useMemo(() => {
    if (!activeOrgId || myOrganizations.length === 0) return null;
    return (
      myOrganizations.find(
        (item) => (item.organization?._id || item._id) === activeOrgId
      ) || null
    );
  }, [activeOrgId, myOrganizations]);

  const activeOrganization = useMemo(() => {
    if (!activeMembership) return null;
    return activeMembership.organization || activeMembership;
  }, [activeMembership]);

  const currentRole = activeMembership?.role || null;
  const isOwner = currentRole === 'Owner';
  const isAdmin = currentRole === 'Owner' || currentRole === 'Administrator';
  const canEdit =
    currentRole === 'Owner' ||
    currentRole === 'Administrator' ||
    currentRole === 'Editor';
  const canInvite = currentRole === 'Owner' || currentRole === 'Administrator';

  const value = {
    myOrganizations,
    activeOrgId,
    activeOrganization,
    activeMembership,
    currentRole,
    isOwner,
    isAdmin,
    canEdit,
    canInvite,
    loading,
    error,
    refreshMyOrganizations,
    switchOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
