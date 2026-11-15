const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object') {
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
  // Register
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

  // Verify
  const verifyToken = reg.body.data.verificationToken;
  await request('/auth/verify-account', {
    method: 'POST',
    body: { token: verifyToken },
  });

  // Login
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (login.status !== 200) throw new Error(`Login failed: ${JSON.stringify(login.body)}`);

  return {
    user: login.body.data.user,
    token: login.body.data.accessToken,
  };
}

async function runTestSuite() {
  console.log('🧪 Starting Phase 3: Organization Management Integration Test Suite...\n');
  const now = Date.now();

  // 1. Create 3 users
  console.log('Step 1: Setting up 3 distinct user accounts');
  const userA = await registerAndLogin('Alice Founder', `alice_${now}@circle.io`, 'Secret123!');
  const userB = await registerAndLogin('Bob Admin', `bob_${now}@circle.io`, 'Secret123!');
  const userC = await registerAndLogin('Charlie Member', `charlie_${now}@circle.io`, 'Secret123!');
  console.log('✅ Users created: Alice (Owner), Bob (Admin), Charlie (Member)');

  // 2. User A creates an organization
  console.log('\nStep 2: User A creates organization "HyperScale AI"');
  const createRes = await request('/organizations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: {
      name: `HyperScale AI ${now}`,
      type: 'company',
      location: 'Palo Alto, CA',
      website: 'https://hyperscale.ai',
      tagline: 'Autonomous AI infrastructure for enterprises',
      description: 'Building next-generation neural architecture orchestration.',
      industry: 'Artificial Intelligence',
      foundedYear: 2024,
      companyStage: 'Seed',
      teamSize: '11-50',
      socialLinks: {
        twitter: 'https://twitter.com/hyperscale',
        linkedin: 'https://linkedin.com/company/hyperscale',
      },
    },
  });
  console.log(`Status: ${createRes.status}`);
  if (createRes.status !== 201) throw new Error(`Create org failed: ${JSON.stringify(createRes.body)}`);
  const org = createRes.body.data.organization;
  const orgId = org._id || org.id;
  const ownerMembership = createRes.body.data.membership;
  console.log('✅ Organization created:', org.name, 'ID:', orgId, 'Role:', ownerMembership.role);

  // 3. Check User A's organizations
  console.log('\nStep 3: User A checks GET /api/organizations/my');
  const myResA = await request('/organizations/my', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  console.log(`Status: ${myResA.status}`);
  if (myResA.status !== 200 || myResA.body.data.length !== 1) {
    throw new Error('User A does not see created organization in /my');
  }
  console.log('✅ User A sees 1 organization with role:', myResA.body.data[0].myMembership.role);

  // 4. Check User B's organizations (should be 0)
  console.log('\nStep 4: User B checks GET /api/organizations/my (isolation check)');
  const myResB = await request('/organizations/my', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  console.log(`Status: ${myResB.status}`);
  if (myResB.status !== 200 || myResB.body.data.length !== 0) {
    throw new Error('User B unexpectedly sees organizations in /my');
  }
  console.log('✅ User B sees 0 organizations (User-Org separation verified).');

  // 5. User A invites User B as 'Administrator'
  console.log('\nStep 5: User A invites User B as Administrator');
  const inviteRes = await request(`/organizations/${orgId}/invitations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: {
      email: userB.user.email,
      role: 'Administrator',
    },
  });
  console.log(`Status: ${inviteRes.status}`);
  if (inviteRes.status !== 201) throw new Error(`Invite failed: ${JSON.stringify(inviteRes.body)}`);
  const inviteToken = inviteRes.body.data.token;
  console.log('✅ Invitation created with token:', inviteToken);

  // 6. Inspect invitation by token (public endpoint)
  console.log('\nStep 6: Public inspect GET /api/organizations/invitations/:token');
  const inspectRes = await request(`/organizations/invitations/${inviteToken}`, { method: 'GET' });
  console.log(`Status: ${inspectRes.status}`);
  if (inspectRes.status !== 200 || inspectRes.body.data.role !== 'Administrator') {
    throw new Error('Inspect invite failed');
  }
  console.log('✅ Invitation details verified for org:', inspectRes.body.data.organizationId.name);

  // 7. User B accepts invitation
  console.log('\nStep 7: User B accepts invitation');
  const acceptRes = await request('/organizations/invitations/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userB.token}` },
    body: { token: inviteToken },
  });
  console.log(`Status: ${acceptRes.status}`);
  if (acceptRes.status !== 200 || acceptRes.body.data.membership.role !== 'Administrator') {
    throw new Error('Accept invite failed');
  }
  const bobMembershipId = acceptRes.body.data.membership._id;
  console.log('✅ User B accepted. Role:', acceptRes.body.data.membership.role);

  // 8. User B now sees the organization in /my
  console.log('\nStep 8: User B verifies GET /api/organizations/my');
  const bobMyRes = await request('/organizations/my', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  if (bobMyRes.body.data.length !== 1 || bobMyRes.body.data[0].myMembership.role !== 'Administrator') {
    throw new Error('User B does not see organization with Administrator role');
  }
  console.log('✅ User B is confirmed active Administrator.');

  // 9. User B (Administrator) updates company profile
  console.log('\nStep 9: User B (Administrator) updates company tagline');
  const updateRes = await request(`/organizations/${orgId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userB.token}` },
    body: {
      tagline: 'Leading next-gen enterprise intelligence',
      companyStage: 'Series A',
    },
  });
  console.log(`Status: ${updateRes.status}`);
  if (updateRes.status !== 200 || updateRes.body.data.profile.companyStage !== 'Series A') {
    throw new Error('Admin profile update failed');
  }
  console.log('✅ Administrator updated profile successfully.');

  // 10. User B (Administrator) invites User C as 'Member'
  console.log('\nStep 10: User B invites User C as Member');
  const inviteCRes = await request(`/organizations/${orgId}/invitations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userB.token}` },
    body: {
      email: userC.user.email,
      role: 'Member',
    },
  });
  if (inviteCRes.status !== 201) throw new Error('User B failed to invite User C');
  const inviteTokenC = inviteCRes.body.data.token;
  console.log('✅ User C invited.');

  // 11. Security Constraint: User B (Administrator) tries to invite as 'Owner' (must be blocked 403)
  console.log('\nStep 11: Security check - Administrator attempts to invite someone as Owner (expect 403)');
  const badOwnerInvite = await request(`/organizations/${orgId}/invitations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userB.token}` },
    body: {
      email: `fake_${now}@circle.io`,
      role: 'Owner',
    },
  });
  console.log(`Status: ${badOwnerInvite.status} (expected 403)`);
  if (badOwnerInvite.status !== 403) {
    throw new Error(`Admin was allowed to invite Owner: status ${badOwnerInvite.status}`);
  }
  console.log('✅ Administrator forbidden from assigning Owner role (403).');

  // 12. User C accepts invitation
  console.log('\nStep 12: User C accepts invitation');
  const acceptCRes = await request('/organizations/invitations/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userC.token}` },
    body: { token: inviteTokenC },
  });
  if (acceptCRes.status !== 200) throw new Error('User C failed to accept invite');
  const charlieMembershipId = acceptCRes.body.data.membership._id;
  console.log('✅ User C joined as Member.');

  // 13. Security Constraint: User C (Member) attempts to update profile (must be blocked 403)
  console.log('\nStep 13: Security check - Member attempts to edit company profile (expect 403)');
  const memberEditRes = await request(`/organizations/${orgId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userC.token}` },
    body: { tagline: 'Hacked by member' },
  });
  console.log(`Status: ${memberEditRes.status} (expected 403)`);
  if (memberEditRes.status !== 403) {
    throw new Error(`Member was able to edit company profile: status ${memberEditRes.status}`);
  }
  console.log('✅ Member forbidden from editing profile (403).');

  // 14. User A (Owner) promotes User C to 'Editor'
  console.log('\nStep 14: User A promotes User C to Editor');
  const promoteRes = await request(`/organizations/${orgId}/members/${charlieMembershipId}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: { role: 'Editor' },
  });
  console.log(`Status: ${promoteRes.status}`);
  if (promoteRes.status !== 200 || promoteRes.body.data.role !== 'Editor') {
    throw new Error('Promote to Editor failed');
  }
  console.log('✅ User C promoted to Editor.');

  // 15. User C (now Editor) updates company profile -> succeeds!
  console.log('\nStep 15: User C (Editor) updates company profile');
  const editorEditRes = await request(`/organizations/${orgId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userC.token}` },
    body: { description: 'Updated by certified Editor.' },
  });
  console.log(`Status: ${editorEditRes.status}`);
  if (editorEditRes.status !== 200) throw new Error('Editor was not allowed to update profile');
  console.log('✅ Editor successfully updated profile.');

  // 16. Security Constraint: Administrator attempts to remove Owner (must be blocked 403)
  console.log('\nStep 16: Security check - Administrator attempts to remove Owner (expect 403)');
  const badRemoveOwner = await request(`/organizations/${orgId}/members/${ownerMembership._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  console.log(`Status: ${badRemoveOwner.status} (expected 403)`);
  if (badRemoveOwner.status !== 403) {
    throw new Error(`Administrator was able to delete Owner: ${badRemoveOwner.status}`);
  }
  console.log('✅ Administrator forbidden from deleting Owner (403).');

  // 17. Security Constraint: Owner attempts to leave organization as sole Owner (must be blocked 400)
  console.log('\nStep 17: Security check - Sole Owner attempts to leave without transferring ownership (expect 400)');
  const badOwnerLeave = await request(`/organizations/${orgId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  console.log(`Status: ${badOwnerLeave.status} (expected 400)`);
  if (badOwnerLeave.status !== 400) {
    throw new Error(`Sole Owner was allowed to abandon organization: ${badOwnerLeave.status}`);
  }
  console.log('✅ Sole Owner prevented from leaving without transfer (400).');

  // 18. User C leaves the organization
  console.log('\nStep 18: User C leaves the organization');
  const leaveRes = await request(`/organizations/${orgId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userC.token}` },
  });
  console.log(`Status: ${leaveRes.status}`);
  if (leaveRes.status !== 200) throw new Error('User C failed to leave org');
  console.log('✅ User C left the organization.');

  // 19. User A removes User B
  console.log('\nStep 19: User A removes User B');
  const removeRes = await request(`/organizations/${orgId}/members/${bobMembershipId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  console.log(`Status: ${removeRes.status}`);
  if (removeRes.status !== 200) throw new Error('Failed to remove member');
  console.log('✅ User B removed by Owner.');

  // 20. Public directory check
  console.log('\nStep 20: Public Discovery Directory GET /api/organizations/public');
  const publicRes = await request('/organizations/public?search=HyperScale', { method: 'GET' });
  console.log(`Status: ${publicRes.status}`);
  if (publicRes.status !== 200 || publicRes.body.data.organizations.length === 0) {
    throw new Error('Public discovery failed to return organization');
  }
  console.log(
    '✅ Public discovery succeeded:',
    publicRes.body.data.organizations[0].name,
    'Member count:',
    publicRes.body.data.organizations[0].memberCount
  );

  console.log('\n🎉 ALL 20 ORGANIZATION TESTS PASSED WITH 100% SUCCESS!\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
