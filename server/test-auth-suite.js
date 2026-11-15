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

async function runTests() {
  console.log('🧪 Starting Auth Test Suite...\n');
  const testEmail = `founder_${Date.now()}@goldencircle.io`;
  const initialPassword = 'SecurePassword123!';
  const updatedPassword = 'NewSecurePassword456!';

  let verificationToken = '';
  let resetToken = '';
  let accessToken = '';
  let refreshTokenCookie = '';
  let userId = '';

  // 1. Register
  console.log('Test 1: Register new user');
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Elon Musk',
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
      location: 'San Francisco, CA',
      accountType: 'startup',
    },
  });
  console.log(`Status: ${regRes.status}`);
  if (regRes.status !== 201) throw new Error(`Register failed: ${JSON.stringify(regRes.body)}`);
  verificationToken = regRes.body.data.verificationToken;
  userId = regRes.body.data.user._id || regRes.body.data.user.id;
  console.log('✅ User registered successfully. Status:', regRes.body.data.user.status);
  console.log('Verification Token:', verificationToken);

  // 2. Duplicate registration
  console.log('\nTest 2: Reject duplicate registration (409 Conflict)');
  const dupRes = await request('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Elon Musk',
      email: testEmail,
      password: initialPassword,
    },
  });
  console.log(`Status: ${dupRes.status} (expected 409)`);
  if (dupRes.status !== 409) throw new Error('Duplicate registration was not rejected with 409');
  console.log('✅ Duplicate registration correctly rejected.');

  // 3. Verify Account
  console.log('\nTest 3: Verify Account via token');
  const verifyRes = await request('/auth/verify-account', {
    method: 'POST',
    body: { token: verificationToken },
  });
  console.log(`Status: ${verifyRes.status}`);
  if (verifyRes.status !== 200 || !verifyRes.body.data.isEmailVerified) {
    throw new Error(`Email verification failed: ${JSON.stringify(verifyRes.body)}`);
  }
  console.log('✅ Email verified successfully. Status:', verifyRes.body.data.status);

  // 4. Login with correct credentials
  console.log('\nTest 4: Login with valid credentials');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: initialPassword,
    },
  });
  console.log(`Status: ${loginRes.status}`);
  if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
  accessToken = loginRes.body.data.accessToken;
  const setCookies = loginRes.headers['set-cookie'];
  if (setCookies && setCookies[0]) {
    refreshTokenCookie = setCookies[0].split(';')[0];
  }
  console.log('✅ Login succeeded. Access Token acquired.');
  console.log('Cookie acquired:', refreshTokenCookie);

  // 5. Login with invalid password
  console.log('\nTest 5: Login with invalid password (401)');
  const badLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: 'WrongPassword!',
    },
  });
  console.log(`Status: ${badLoginRes.status} (expected 401)`);
  if (badLoginRes.status !== 401) throw new Error('Bad login was not rejected');
  console.log('✅ Bad login rejected with 401.');

  // 6. Access protected /me route
  console.log('\nTest 6: Access GET /api/auth/me with Bearer token');
  const meRes = await request('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log(`Status: ${meRes.status}`);
  if (meRes.status !== 200 || meRes.body.data.email !== testEmail) {
    throw new Error(`Protected route /me failed: ${JSON.stringify(meRes.body)}`);
  }
  console.log('✅ Protected /me retrieved:', meRes.body.data.fullName, meRes.body.data.email);

  // 7. Access protected /me route without token
  console.log('\nTest 7: Access /me without token (401)');
  const unauthRes = await request('/auth/me', { method: 'GET' });
  console.log(`Status: ${unauthRes.status} (expected 401)`);
  if (unauthRes.status !== 401) throw new Error('Unauthenticated /me did not return 401');
  console.log('✅ Missing token rejected with 401.');

  // 8. Refresh Token
  console.log('\nTest 8: Refresh access token via cookie');
  const refreshRes = await request('/auth/refresh', {
    method: 'POST',
    headers: { Cookie: refreshTokenCookie },
  });
  console.log(`Status: ${refreshRes.status}`);
  if (refreshRes.status !== 200 || !refreshRes.body.data.accessToken) {
    throw new Error(`Token refresh failed: ${JSON.stringify(refreshRes.body)}`);
  }
  accessToken = refreshRes.body.data.accessToken;
  console.log('✅ Access token refreshed successfully.');

  // 9. Forgot Password
  console.log('\nTest 9: Forgot Password');
  const forgotRes = await request('/auth/forgot-password', {
    method: 'POST',
    body: { email: testEmail },
  });
  console.log(`Status: ${forgotRes.status}`);
  if (forgotRes.status !== 200) throw new Error(`Forgot password failed: ${JSON.stringify(forgotRes.body)}`);
  resetToken = forgotRes.body.data.resetToken;
  console.log('✅ Reset token generated:', resetToken);

  // 10. Reset Password
  console.log('\nTest 10: Reset Password with valid token');
  const resetRes = await request('/auth/reset-password', {
    method: 'POST',
    body: {
      token: resetToken,
      password: updatedPassword,
      confirmPassword: updatedPassword,
    },
  });
  console.log(`Status: ${resetRes.status}`);
  if (resetRes.status !== 200) throw new Error(`Reset password failed: ${JSON.stringify(resetRes.body)}`);
  console.log('✅ Password successfully reset.');

  // 11. Login with new password
  console.log('\nTest 11: Login with updated password');
  const newLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: updatedPassword,
    },
  });
  console.log(`Status: ${newLoginRes.status}`);
  if (newLoginRes.status !== 200) throw new Error('Login with new password failed');
  accessToken = newLoginRes.body.data.accessToken;
  console.log('✅ Logged in successfully with new password.');

  // 12. Suspend user status
  console.log('\nTest 12: Suspend user status (requirement 10 check)');
  const suspendRes = await request(`/auth/users/${userId}/status`, {
    method: 'PATCH',
    body: { status: 'suspended' },
  });
  console.log(`Status: ${suspendRes.status}`);
  if (suspendRes.status !== 200 || suspendRes.body.data.status !== 'suspended') {
    throw new Error('Suspend user failed');
  }
  console.log('✅ User status updated to suspended.');

  // 13. Attempt login while suspended -> 403 Forbidden
  console.log('\nTest 13: Attempt login while suspended (expect 403 Forbidden)');
  const suspendedLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: updatedPassword,
    },
  });
  console.log(`Status: ${suspendedLoginRes.status} (expected 403)`);
  if (suspendedLoginRes.status !== 403) {
    throw new Error(`Suspended user login did not return 403, got ${suspendedLoginRes.status}`);
  }
  console.log('✅ Suspended user login blocked with 403 Forbidden.');

  // 14. Attempt /me while suspended -> 403 Forbidden
  console.log('\nTest 14: Attempt /me with token while suspended (expect 403 Forbidden)');
  const suspendedMeRes = await request('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log(`Status: ${suspendedMeRes.status} (expected 403)`);
  if (suspendedMeRes.status !== 403) {
    throw new Error(`Suspended user /me did not return 403, got ${suspendedMeRes.status}`);
  }
  console.log('✅ Suspended user /me blocked with 403 Forbidden.');

  // 15. Reactivate user
  console.log('\nTest 15: Reactivate user');
  const reactivateRes = await request(`/auth/users/${userId}/status`, {
    method: 'PATCH',
    body: { status: 'active' },
  });
  console.log(`Status: ${reactivateRes.status}`);
  if (reactivateRes.status !== 200 || reactivateRes.body.data.status !== 'active') {
    throw new Error('Reactivate user failed');
  }
  console.log('✅ User status reactivated to active.');

  // 16. Logout
  console.log('\nTest 16: Logout');
  const logoutRes = await request('/auth/logout', {
    method: 'POST',
    headers: {
      Cookie: refreshTokenCookie,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log(`Status: ${logoutRes.status}`);
  if (logoutRes.status !== 200) throw new Error('Logout failed');
  console.log('✅ Logout succeeded, cookie cleared.');

  console.log('\n🎉 ALL 16 AUTH TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
