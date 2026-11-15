import axios from 'axios';

let authToken = localStorage.getItem('gc_token') || null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('gc_token', token);
  } else {
    localStorage.removeItem('gc_token');
  }
};

export const getAuthToken = () => {
  return authToken || localStorage.getItem('gc_token');
};

// Support external API URL in production (e.g. Vercel deployment)
const rawBaseURL = import.meta.env.VITE_API_URL || '';
const cleanBaseURL = rawBaseURL ? `${rawBaseURL.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({
  baseURL: cleanBaseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/forgot-password') ||
      originalRequest?.url?.includes('/auth/reset-password');

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${cleanBaseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken =
          refreshResponse.data?.data?.accessToken ||
          refreshResponse.data?.accessToken;

        if (newAccessToken) {
          setAuthToken(newAccessToken);
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No access token returned from refresh');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAuthToken(null);
        window.dispatchEvent(new CustomEvent('gc:auth:expired'));
        return Promise.reject({
          message: 'Session expired. Please sign in again.',
          status: 401,
          originalError: refreshErr,
        });
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject({
      message,
      status,
      errors: error.response?.data?.errors,
      originalError: error,
    });
  }
);

export default api;
