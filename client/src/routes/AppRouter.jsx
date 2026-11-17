import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { OrganizationProvider } from '../context/OrganizationContext';
import { ChatProvider } from '../context/ChatContext';
import RootLayout from '../layouts/RootLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import AdminRoute from './AdminRoute';
import PageLoader from '../components/common/PageLoader';

// Core Pages (Eagerly Loaded for Instant Initial Paint)
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyAccount from '../pages/auth/VerifyAccount';

// Code Splitting & Lazy Loading for Secondary Modules
const StartupDiscovery = lazy(() => import('../pages/discovery/StartupDiscovery'));

// Organization Pages
const CreateOrganization = lazy(() => import('../pages/organizations/CreateOrganization'));
const CompanyProfile = lazy(() => import('../pages/organizations/CompanyProfile'));
const OrgDashboard = lazy(() => import('../pages/organizations/OrgDashboard'));
const OrgProfileStudio = lazy(() => import('../pages/organizations/OrgProfileStudio'));
const OrgMembers = lazy(() => import('../pages/organizations/OrgMembers'));
const OrgSettings = lazy(() => import('../pages/organizations/OrgSettings'));
const AcceptInvitation = lazy(() => import('../pages/organizations/AcceptInvitation'));

// Events Platform
const EventDiscovery = lazy(() => import('../pages/events/EventDiscovery'));
const EventDetails = lazy(() => import('../pages/events/EventDetails'));
const EventSubmission = lazy(() => import('../pages/events/EventSubmission'));
const EventManagementDashboard = lazy(() => import('../pages/events/EventManagementDashboard'));

// Jobs Platform
const JobDiscovery = lazy(() => import('../pages/jobs/JobDiscovery'));
const JobDetails = lazy(() => import('../pages/jobs/JobDetails'));
const JobSubmission = lazy(() => import('../pages/jobs/JobSubmission'));
const JobManagementDashboard = lazy(() => import('../pages/jobs/JobManagementDashboard'));

// Networking & Chat Platform
const NetworkHub = lazy(() => import('../pages/network/NetworkHub'));
const Messages = lazy(() => import('../pages/chat/Messages'));

// Phase 10 Admin Governance Console
const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const AdminOverview = lazy(() => import('../pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminOrganizations = lazy(() => import('../pages/admin/AdminOrganizations'));
const AdminEvents = lazy(() => import('../pages/admin/AdminEvents'));
const AdminJobs = lazy(() => import('../pages/admin/AdminJobs'));
const AdminEditorialCMS = lazy(() => import('../pages/admin/AdminEditorialCMS'));
const AdminModeration = lazy(() => import('../pages/admin/AdminModeration'));
const AdminPlatformConfig = lazy(() => import('../pages/admin/AdminPlatformConfig'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminAuditLogs = lazy(() => import('../pages/admin/AdminAuditLogs'));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <ChatProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Main Application Routes */}
                <Route path="/" element={<RootLayout />}>
                  <Route index element={<Home />} />
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Discovery Routes */}
                  <Route path="discover" element={<StartupDiscovery />} />
                  <Route path="startups" element={<StartupDiscovery />} />
                  <Route path="organizations" element={<StartupDiscovery />} />

                  {/* Organization Profile & Studio Routes */}
                  <Route
                    path="organizations/new"
                    element={
                      <ProtectedRoute>
                        <CreateOrganization />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="organizations/:id" element={<CompanyProfile />} />
                  <Route
                    path="organizations/:id/dashboard"
                    element={
                      <ProtectedRoute>
                        <OrgDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="organizations/:id/studio"
                    element={
                      <ProtectedRoute>
                        <OrgProfileStudio />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="organizations/:id/members"
                    element={
                      <ProtectedRoute>
                        <OrgMembers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="organizations/:id/settings"
                    element={
                      <ProtectedRoute>
                        <OrgSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="invitations/:token" element={<AcceptInvitation />} />

                  {/* Events Platform Routes */}
                  <Route path="events" element={<EventDiscovery />} />
                  <Route path="events/:slugOrId" element={<EventDetails />} />
                  <Route
                    path="events/new"
                    element={
                      <ProtectedRoute>
                        <EventSubmission />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="events/manage"
                    element={
                      <ProtectedRoute>
                        <EventManagementDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Startup Job Board Routes */}
                  <Route path="jobs" element={<JobDiscovery />} />
                  <Route
                    path="jobs/new"
                    element={
                      <ProtectedRoute>
                        <JobSubmission />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="jobs/manage"
                    element={
                      <ProtectedRoute>
                        <JobManagementDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="jobs/:slugOrId" element={<JobDetails />} />

                  {/* Networking & Direct Messaging Routes */}
                  <Route
                    path="network"
                    element={
                      <ProtectedRoute>
                        <NetworkHub />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="messages"
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="messages/:conversationId"
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* Authentication Routes */}
                <Route element={<AuthLayout />}>
                  <Route
                    path="login"
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="register"
                    element={
                      <GuestRoute>
                        <Register />
                      </GuestRoute>
                    }
                  />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                  <Route path="verify-account" element={<VerifyAccount />} />
                  <Route path="verify-email" element={<VerifyAccount />} />
                </Route>

                {/* Phase 10 Executive Admin Governance Console */}
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="organizations" element={<AdminOrganizations />} />
                  <Route path="events" element={<AdminEvents />} />
                  <Route path="jobs" element={<AdminJobs />} />
                  <Route path="cms" element={<AdminEditorialCMS />} />
                  <Route path="moderation" element={<AdminModeration />} />
                  <Route path="config" element={<AdminPlatformConfig />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                </Route>
              </Routes>
            </Suspense>
          </ChatProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
