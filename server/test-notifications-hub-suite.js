const http = require('http');
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const notificationService = require('./src/services/notification.service');

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

async function registerAndLogin(name, email, password) {
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
  if (user && user.verificationToken) {
    await request('/auth/verify-account', {
      method: 'POST',
      body: { token: user.verificationToken },
    });
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

async function runNotificationsHubSuite() {
  console.log('====================================================');
  console.log('🧪 THE GOLDEN CIRCLE - PHASE 9: NOTIFICATIONS & HUB SUITE');
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
    // 1. Setup Users
    console.log('\n--- Setup Users ---');
    const userA = await registerAndLogin('Sarah Founder', `sarah_${ts}@solaria.io`, 'StrongPass123!');
    const userB = await registerAndLogin('Brian Member', `brian_${ts}@member.com`, 'StrongPass123!');

    assert('Users registered & logged in successfully', !!userA.token && !!userB.token);

    const aId = userA.user._id || userA.user.id;
    const bId = userB.user._id || userB.user.id;

    // 2. Direct Notification Creation & Retrieval
    console.log('\n--- Test Notification Engine ---');
    await notificationService.createNotification({
      userId: bId,
      type: 'invitation',
      title: 'Welcome to The Golden Circle Syndicate',
      message: 'You have been granted access to executive networking channels.',
      link: '/network',
    });

    const notifList = await request('/notifications', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Get notifications returns 200', notifList.status === 200);
    assert('Notification is present in list', notifList.body.data.length >= 1);
    const notif1 = notifList.body.data[0];
    assert('Notification title matches', notif1.title.includes('Welcome to The Golden Circle'));

    // 3. Unread count check
    const unreadCountRes = await request('/notifications/unread-count', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Unread count is at least 1', unreadCountRes.status === 200 && unreadCountRes.body.data.unreadCount >= 1);

    // 4. Mark single notification as read
    const markReadRes = await request(`/notifications/${notif1._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Mark notification as read (200)', markReadRes.status === 200 && markReadRes.body.data.isRead === true);

    // 5. Mark all as read
    await notificationService.createNotification({
      userId: bId,
      type: 'general',
      title: 'Update 1',
      message: 'Platform update test',
    });
    await notificationService.createNotification({
      userId: bId,
      type: 'general',
      title: 'Update 2',
      message: 'Security update test',
    });

    const markAllRes = await request('/notifications/mark-all-read', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Mark all notifications as read (200)', markAllRes.status === 200);

    const unreadAfterMarkAll = await request('/notifications/unread-count', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Unread count is now 0', unreadAfterMarkAll.body.data.unreadCount === 0);

    // 6. Delete notification
    const deleteNotifRes = await request(`/notifications/${notif1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Delete notification returns 200', deleteNotifRes.status === 200);

    // 7. Notification preferences
    console.log('\n--- Test Notification Preferences ---');
    const getPrefsRes = await request('/notifications/preferences', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Get notification preferences (200)', getPrefsRes.status === 200 && getPrefsRes.body.data.emailInvitations === true);

    const updatePrefsRes = await request('/notifications/preferences', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: { emailMarketing: true, emailJobUpdates: false },
    });
    assert('Update notification preferences (200)', updatePrefsRes.status === 200 && updatePrefsRes.body.data.emailMarketing === true && updatePrefsRes.body.data.emailJobUpdates === false);

    // 8. Follow System (Unified Follow Engine)
    console.log('\n--- Test Unified Follows Engine ---');
    const orgRes = await request('/organizations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: {
        name: `Solaria Cloud ${ts}`,
        type: 'company',
        industry: 'Cloud Infrastructure',
        description: 'Decentralized high-performance compute network.',
      },
    });
    assert('Organization created for follow tests', orgRes.status === 201);
    const orgId = (orgRes.body.data.organization || orgRes.body.data)._id;

    // Follow organization
    const followOrgRes = await request(`/follows/organization/${orgId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B follows organization (200)', followOrgRes.status === 200 && followOrgRes.body.data.isFollowing === true);

    // Check status
    const statusOrgRes = await request(`/follows/status/organization/${orgId}`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Follow status returns isFollowing: true', statusOrgRes.status === 200 && statusOrgRes.body.data.isFollowing === true);

    // Follow founder
    const followFounderRes = await request(`/follows/founder/${aId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B follows founder User A (200)', followFounderRes.status === 200 && followFounderRes.body.data.isFollowing === true);

    // Self-follow rejection
    const selfFollowRes = await request(`/follows/founder/${aId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('Self follow rejected with 400', selfFollowRes.status === 400);

    // Retrieve my follows
    const myFollowsRes = await request('/follows/my', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Get my follows returns followed entities', myFollowsRes.status === 200 && myFollowsRes.body.data.length >= 2);

    // Unfollow organization
    const unfollowOrgRes = await request(`/follows/organization/${orgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Unfollow organization returns isFollowing: false', unfollowOrgRes.status === 200 && unfollowOrgRes.body.data.isFollowing === false);

    // 9. Saved Items System (Unified Bookmark Engine)
    console.log('\n--- Test Unified Saved Items Engine ---');
    const saveCompanyRes = await request(`/saved-items/company/${orgId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B saves company (200)', saveCompanyRes.status === 200 && saveCompanyRes.body.data.isSaved === true);

    const checkSavedRes = await request(`/saved-items/status/company/${orgId}`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Check saved status returns isSaved: true', checkSavedRes.status === 200 && checkSavedRes.body.data.isSaved === true);

    const getSavedRes = await request('/saved-items', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Get saved items returns list & category counts', getSavedRes.status === 200 && getSavedRes.body.data.length >= 1 && getSavedRes.body.meta.company >= 1);

    const unsaveCompanyRes = await request(`/saved-items/company/${orgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Unsave company returns isSaved: false', unsaveCompanyRes.status === 200 && unsaveCompanyRes.body.data.isSaved === false);

    // 10. Personal Executive Dashboard Hub
    console.log('\n--- Test Personal Executive Dashboard Hub ---');
    // Update profile with headline & bio
    const updateProfileRes = await request('/dashboard/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: {
        headline: 'Lead Cloud Architect & AI Strategist',
        bio: 'Over a decade architecting resilient cloud infrastructure for scale.',
        location: 'San Francisco, CA',
      },
    });
    assert('Profile updated successfully (200)', updateProfileRes.status === 200 && updateProfileRes.body.data.headline.includes('Lead Cloud Architect'));

    const dashboardRes = await request('/dashboard/personal', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Get personal dashboard returns 200', dashboardRes.status === 200);
    const dash = dashboardRes.body.data;
    assert('Profile completion percentage >= 70%', dash.profileCompletion && dash.profileCompletion.percentage >= 70);
    assert('Counts payload contains required counters', typeof dash.counts.connections === 'number' && typeof dash.counts.unreadNotifications === 'number');
    assert('Activity feed is present', Array.isArray(dash.activityFeed));
    assert('Followed ventures is present', Array.isArray(dash.followedVentures));

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(`Phase 9 Test Suite Finished: ${passed} passed, ${failed} failed`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runNotificationsHubSuite();
