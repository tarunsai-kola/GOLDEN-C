import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setTokenState] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const applyAuthData = (userData, token) => {
    setUser(userData);
    if (token) {
      setAuthToken(token);
      setTokenState(token);
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setTokenState(null);
    setAuthToken(null);
  };

  // Check auth session on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const existingToken = getAuthToken();

      if (existingToken) {
        try {
          const res = await api.get('/auth/me');
          if (isMounted) {
            const userData = res.data?.data?.user || res.data?.data || res.data?.user;
            setUser(userData);
            setLoading(false);
            return;
          }
        } catch {
          // Access token might be expired, will attempt refresh below
        }
      }

      // Try silent refresh using HTTP-only cookie
      try {
        const refreshRes = await api.post('/auth/refresh');
        const newToken =
          refreshRes.data?.data?.accessToken ||
          refreshRes.data?.accessToken;

        if (newToken && isMounted) {
          applyAuthData(null, newToken);
          const meRes = await api.get('/auth/me');
          const userData = meRes.data?.data?.user || meRes.data?.data || meRes.data?.user;
          setUser(userData);
        }
      } catch {
        if (isMounted) {
          clearAuthData();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    const handleExpired = () => {
      clearAuthData();
    };

    window.addEventListener('gc:auth:expired', handleExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('gc:auth:expired', handleExpired);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', credentials);
      const data = res.data?.data || res.data;

      if (res.data?.requiresReactivation || data?.requiresReactivation) {
        return {
          requiresReactivation: true,
          isDeactivated: true,
          message: res.data?.message || 'Your account is currently deactivated.',
          user: data?.user || data,
        };
      }

      const loggedUser = data.user || data;
      const token = data.accessToken || data.token;

      applyAuthData(loggedUser, token);
      return { success: true, user: loggedUser, token };
    } catch (err) {
      const msg = err.message || 'Login failed';
      setAuthError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (userData) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/register', userData);
      const data = res.data?.data || res.data;
      return {
        success: true,
        message: res.data?.message || 'Registration successful',
        data,
      };
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout endpoint error:', err);
    } finally {
      clearAuthData();
    }
  }, []);

  const verifyAccount = useCallback(async (token) => {
    try {
      // Support both /auth/verify-account and /auth/verify-email
      let res;
      try {
        res = await api.post('/auth/verify-account', { token });
      } catch (postErr) {
        if (postErr.status === 404) {
          res = await api.post('/auth/verify-email', { token });
        } else {
          throw postErr;
        }
      }
      const data = res.data?.data || res.data;
      if (data?.user) {
        setUser(data.user);
      }
      return {
        success: true,
        message: res.data?.message || 'Account verified successfully',
        data,
      };
    } catch (err) {
      throw err;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: res.data?.message || 'Password reset link sent',
        data: res.data?.data,
      };
    } catch (err) {
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async ({ token, password, confirmPassword }) => {
    try {
      const payload = { token, password };
      if (confirmPassword) payload.confirmPassword = confirmPassword;
      const res = await api.post('/auth/reset-password', payload);
      return {
        success: true,
        message: res.data?.message || 'Password reset successfully',
        data: res.data?.data,
      };
    } catch (err) {
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      const updatedUser = res.data?.data?.user || res.data?.data || res.data;
      if (updatedUser) {
        setUser(updatedUser);
      }
      return {
        success: true,
        message: res.data?.message || 'Profile updated successfully',
        data: updatedUser,
      };
    } catch (err) {
      throw err;
    }
  }, []);

  const deactivateAccount = useCallback(async () => {
    try {
      const res = await api.post('/auth/deactivate');
      clearAuthData();
      return {
        success: true,
        message: res.data?.message || 'Account deactivated successfully',
      };
    } catch (err) {
      clearAuthData();
      throw err;
    }
  }, []);

  const reactivateAccount = useCallback(async ({ email, password }) => {
    try {
      const res = await api.post('/auth/reactivate', { email, password });
      const data = res.data?.data || res.data;
      const loggedUser = data.user || data;
      const token = data.accessToken || data.token;
      applyAuthData(loggedUser, token);
      return {
        success: true,
        message: res.data?.message || 'Account reactivated successfully',
        user: loggedUser,
        token,
      };
    } catch (err) {
      throw err;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data?.data?.user || res.data?.data || res.data?.user;
      setUser(userData);
      return userData;
    } catch (err) {
      throw err;
    }
  }, []);

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user),
    loading,
    authError,
    login,
    register,
    logout,
    updateProfile,
    deactivateAccount,
    reactivateAccount,
    verifyAccount,
    verifyEmail: verifyAccount,
    forgotPassword,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
