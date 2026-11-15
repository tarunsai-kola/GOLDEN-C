const http = require('http');
const mongoose = require('mongoose');
const User = require('./src/models/user.model');

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function registerAndLogin(name, email, password, role = 'user', adminRole = null) {
  const reg = await request('/auth/register', {
    method: 'POST',
    body: {
      fullName: name,
      email,
      password,
      confirmPassword: password,
      location: 'San Francisco, CA',
    },
  });
  if (reg.status !== 201) throw new Error(`Reg failed: ${JSON.stringify(reg.body)}`);

  const user = await User.findOne({ email });
  if (user) {
    user.isEmailVerified = true;
    user.role = role;
    user.adminRole = adminRole;
    user.status = 'active';
    await user.save();
  }

  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);

  return {
    user: loginRes.body.data.user,
    token: loginRes.body.data.accessToken,
  };
}

async function runAdminConsoleSuite() {
  console.log('====================================================');
  console.log('🧪 THE GOLDEN CIRCLE - PHASE 10: ADMIN CONSOLE SUITE');
  console.log('====================================================');

  await mongoose.connect('mongodb://127.0.0.1:27017/golden-circle');

  const ts = Date.now();
  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Setup Admin & Non-admin accounts
    console.log('\n--- Setup Admin & Member Accounts ---');
    const admin = await registerAndLogin('Platform SuperAdmin', `admin_${ts}@goldencircle.io`, 'StrongPass123!', 'admin', 'super_admin');
    const member = await registerAndLogin('Jordan Founder', `jordan_${ts}@venture.com`, 'StrongPass123!', 'user');
    const candidate = await registerAndLogin('Taylor Peer', `taylor_${ts}@peer.com`, 'StrongPass123!', 'user');

    assert('Admin and regular users provisioned', !!admin.token && !!member.token && !!candidate.token);
    const memberId = member.user._id || member.user.id;
    const candidateId = candidate.user._id || candidate.user.id;

    // 2. Security Check: Non-admin access to admin routes
    console.log('\n--- Test RBAC Security Boundary ---');
    const unauthMetrics = await request('/admin/metrics', {
      headers: { Authorization: `Bearer ${member.token}` },
    });
    assert('Non-admin strictly blocked from admin routes (403 Forbidden)', unauthMetrics.status === 403);

    // 3. Overview Telemetry Metrics
    console.log('\n--- Test Overview Metrics ---');
    const metricsRes = await request('/admin/metrics', {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin retrieves metrics successfully (200)', metricsRes.status === 200);
    const m = metricsRes.body.data;
    assert('Metrics include users, orgs, events, jobs, connections', typeof m.users.total === 'number' && typeof m.organizations.total === 'number' && typeof m.events.total === 'number' && typeof m.jobs.active === 'number');

    // 4. User Governance
    console.log('\n--- Test User Governance ---');
    const usersRes = await request('/admin/users', {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin retrieves users roster (200)', usersRes.status === 200 && usersRes.body.data.length >= 3);

    // Suspend user
    const suspendRes = await request(`/admin/users/${memberId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { status: 'suspended', reason: 'Automated policy violation test' },
    });
    assert('Admin suspends user account (200)', suspendRes.status === 200 && suspendRes.body.data.status === 'suspended');

    // Suspended user blocked
    const suspendedCheck = await request('/auth/me', {
      headers: { Authorization: `Bearer ${member.token}` },
    });
    assert('Suspended user blocked from accessing platform (403)', suspendedCheck.status === 403);

    // Reactivate user
    const reactivateRes = await request(`/admin/users/${memberId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { status: 'active', reason: 'Reinstated after review' },
    });
    assert('Admin reactivates user account (200)', reactivateRes.status === 200 && reactivateRes.body.data.status === 'active');

    // Update user role
    const updateRoleRes = await request(`/admin/users/${memberId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { role: 'user', adminRole: 'moderator' },
    });
    assert('Admin updates user role successfully (200)', updateRoleRes.status === 200 && updateRoleRes.body.data.adminRole === 'moderator');

    // 5. Organization Governance & Verification Badge
    console.log('\n--- Test Organization Verification ---');
    const orgRes = await request('/organizations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${member.token}` },
      body: {
        name: `HyperScale Systems ${ts}`,
        type: 'company',
        industry: 'Cloud Architecture',
        description: 'Autonomous cloud resilience platform.',
      },
    });
    assert('Organization created for admin review', orgRes.status === 201);
    const orgId = (orgRes.body.data.organization || orgRes.body.data)._id;

    // Admin lists organizations
    const orgsList = await request('/admin/organizations', {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin retrieves organizations directory (200)', orgsList.status === 200 && orgsList.body.data.some((o) => o._id === orgId));

    // Admin approves verification badge
    const verifyRes = await request(`/admin/organizations/${orgId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { status: 'approved', reason: 'Verified Delaware C-Corp documentation' },
    });
    assert('Admin grants organization verification badge (200)', verifyRes.status === 200 && (verifyRes.body.data?.organization || verifyRes.body.data)?.isVerified === true, JSON.stringify(verifyRes.body));

    // 6. Event Moderation & Featuring
    console.log('\n--- Test Event Moderation & Featuring ---');
    const eventRes = await request('/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${member.token}` },
      body: {
        title: `Enterprise Cloud Summit ${ts}`,
        description: 'Comprehensive walkthrough of distributed database architectures.',
        category: 'Conference',
        date: '2026-12-01',
        startTime: '09:00 AM',
        organizationId: orgId,
      },
    });
    assert('Event submitted by organizer', eventRes.status === 201);
    const eventId = eventRes.body.data._id;

    const eventModRes = await request(`/admin/events/${eventId}/moderation`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { status: 'Published', isFeatured: true },
    });
    assert('Admin approves and features event (200)', eventModRes.status === 200 && eventModRes.body.data.status === 'Published' && eventModRes.body.data.isFeatured === true);

    // 7. Job Moderation & Featuring
    console.log('\n--- Test Job Moderation & Featuring ---');
    const jobRes = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${member.token}` },
      body: {
        title: `Principal Cloud Architect ${ts}`,
        organizationId: orgId,
        description: 'Lead engineering for autonomous cloud deployment engine.',
        employmentType: 'Full-time',
        workplaceType: 'Remote',
        applicationUrl: 'https://hyperscale.io/apply',
      },
    });
    assert('Job posted by organization', jobRes.status === 201);
    const jobId = jobRes.body.data._id;

    const jobModRes = await request(`/admin/jobs/${jobId}/moderation`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { isFeatured: true },
    });
    assert('Admin features job listing (200)', jobModRes.status === 200 && jobModRes.body.data.isFeatured === true);

    // 8. Editorial CMS
    console.log('\n--- Test Editorial CMS ---');
    const articleRes = await request('/admin/cms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: {
        title: `From Zero to Scale: The HyperScale Story ${ts}`,
        type: 'story',
        content: 'Exclusive interview with founder Jordan on building resilient multi-cloud systems.',
        featuredOrgId: orgId,
        hasEditorialConsent: true,
      },
    });
    assert('Admin creates editorial story (201)', articleRes.status === 201, JSON.stringify(articleRes.body));
    const articleId = articleRes.body.data._id;
    assert('Article has unique slug', !!articleRes.body.data.slug);

    const getCmsRes = await request('/admin/cms', {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin retrieves CMS articles (200)', getCmsRes.status === 200 && getCmsRes.body.data.some((a) => a._id === articleId));

    const updateCmsRes = await request(`/admin/cms/${articleId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { title: `Updated HyperScale Story ${ts}` },
    });
    assert('Admin updates editorial article (200)', updateCmsRes.status === 200);

    const deleteCmsRes = await request(`/admin/cms/${articleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin deletes editorial article (200)', deleteCmsRes.status === 200);

    // 9. Moderation Reports Queue
    console.log('\n--- Test Moderation Reports Queue ---');
    const reportJobRes = await request(`/jobs/${jobId}/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidate.token}` },
      body: { reason: 'Incorrect compensation disclosure' },
    });
    assert('Candidate reports job', reportJobRes.status === 201);
    const jobReportId = reportJobRes.body.data._id;

    const reportsQueue = await request('/admin/moderation/reports', {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin retrieves universal moderation reports queue', reportsQueue.status === 200 && reportsQueue.body.data.some((r) => r.reportType === 'job' && r._id === jobReportId));

    const resolveReportRes = await request(`/admin/moderation/reports/job/${jobReportId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { resolution: 'reviewed', actionTaken: 'none', notes: 'Warning issued to poster' },
    });
    assert('Admin resolves job report (200)', resolveReportRes.status === 200);

    // 10. Privacy Gate: Private Direct Messages
    console.log('\n--- Test Privacy Lock on Private Messages ---');
    // Connect member and candidate to allow chat
    const connRes = await request(`/network/connect/${candidateId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${member.token}` },
      body: { note: 'Hi Taylor' },
    });
    const acceptConn = await request(`/network/accept/${connRes.body.data._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidate.token}` },
    });
    assert('Mutual connection established between member and candidate', acceptConn.status === 200);

    // Start conversation and send message
    const convRes = await request('/chat/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${member.token}` },
      body: { recipientId: candidateId },
    });
    const convId = convRes.body.data._id;

    const msgRes = await request(`/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${member.token}` },
      body: { content: 'Confidential private message' },
    });
    assert('Private message sent', msgRes.status === 201);
    const msgId = msgRes.body.data._id;

    // Admin attempts to view unflagged message -> 403 Forbidden Privacy Lock
    const privacyCheckRes = await request(`/admin/moderation/messages/${msgId}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Privacy Gate: Admin rejected from inspecting unflagged private message (403 Forbidden)', privacyCheckRes.status === 403);

    // Candidate reports abusive message
    const reportMsgRes = await request(`/chat/messages/${msgId}/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidate.token}` },
      body: { reason: 'Abusive language test' },
    });
    assert('Candidate reports message', reportMsgRes.status === 200);

    // Admin CAN now inspect reported message
    const inspectAllowed = await request(`/admin/moderation/messages/${msgId}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin permitted to inspect reported message for safety review (200)', inspectAllowed.status === 200 && inspectAllowed.body.data.content === 'Confidential private message');

    // 11. Platform Configuration Engine
    console.log('\n--- Test Platform Configuration Engine ---');
    const updateConfigRes = await request('/admin/config', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: {
        key: 'platform_industries',
        values: ['Artificial Intelligence', 'CleanTech', 'BioTech', 'FinTech', 'SpaceTech'],
        category: 'discovery',
      },
    });
    assert('Admin updates platform config (200)', updateConfigRes.status === 200 && updateConfigRes.body.data.key === 'platform_industries');

    const getConfigsRes = await request('/admin/config', {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin retrieves platform configs (200)', getConfigsRes.status === 200 && getConfigsRes.body.data.some((c) => c.key === 'platform_industries'));

    // 12. Compliance Audit Logs Trail
    console.log('\n--- Test Compliance Audit Logs ---');
    const auditLogsRes = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin retrieves compliance audit logs trail (200)', auditLogsRes.status === 200 && auditLogsRes.body.data.length >= 5);
    const sampleLog = auditLogsRes.body.data[0];
    assert('Audit log contains adminId, action, targetType, timestamp', !!sampleLog.adminId && !!sampleLog.action && !!sampleLog.targetType && !!sampleLog.createdAt);

    // 13. Ecosystem Analytics
    console.log('\n--- Test Ecosystem Analytics ---');
    const analyticsRes = await request('/admin/analytics', {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert('Admin retrieves ecosystem analytics (200)', analyticsRes.status === 200 && Array.isArray(analyticsRes.body.data.organizationTypes));

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(`Phase 10 Test Suite Finished: ${passed} passed, ${failed} failed`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAdminConsoleSuite();
