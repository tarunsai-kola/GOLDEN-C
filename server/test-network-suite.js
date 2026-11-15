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

async function registerAndLogin(name, email, password) {
  const reg = await request('/auth/register', {
    method: 'POST',
    body: {
      fullName: name,
      email,
      password,
      confirmPassword: password,
      location: 'New York, NY',
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

async function runNetworkSuite() {
  console.log('====================================================');
  console.log('🧪 THE GOLDEN CIRCLE - PHASE 8: NETWORKING & CHAT SUITE');
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
    // 1. Setup 3 Users
    console.log('\n--- Setup Users ---');
    const userA = await registerAndLogin('David Founder', `david_${ts}@circle.io`, 'StrongPass123!');
    const userB = await registerAndLogin('Elena Investor', `elena_${ts}@capital.com`, 'StrongPass123!');
    const userC = await registerAndLogin('Frank Stranger', `frank_${ts}@other.com`, 'StrongPass123!');

    assert('3 Users registered and logged in', !!userA.token && !!userB.token && !!userC.token);

    const aId = userA.user._id || userA.user.id;
    const bId = userB.user._id || userB.user.id;
    const cId = userC.user._id || userC.user.id;

    // 2. Initial connection status
    console.log('\n--- Test Initial Connection Status ---');
    const statusInit = await request(`/network/status/${bId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('Initial connection status is none', statusInit.status === 200 && statusInit.body.data.status === 'none');

    // 3. Conversation blocked before connecting
    console.log('\n--- Test Chat Pre-condition Enforcement ---');
    const unauthChat = await request('/chat/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { recipientId: bId },
    });
    assert('Unconnected members cannot start chat (403 Forbidden)', unauthChat.status === 403, JSON.stringify(unauthChat.body));

    // 4. Send Connection Request
    console.log('\n--- Test Connection Requests ---');
    const sendReq = await request(`/network/connect/${bId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { note: 'Hi Elena, let us explore AI co-investments!' },
    });
    assert('Send connection request returns 201', sendReq.status === 201, JSON.stringify(sendReq.body));
    const connId = sendReq.body.data._id;
    assert('Connection note is saved', sendReq.body.data.note.includes('AI co-investments'));

    // 5. Duplicate request prevention
    const dupReq = await request(`/network/connect/${bId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { note: 'Duplicate' },
    });
    assert('Duplicate connection request rejected (400)', dupReq.status === 400);

    // 6. Self connection prevention
    const selfReq = await request(`/network/connect/${aId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { note: 'Self' },
    });
    assert('Self connection request rejected (400)', selfReq.status === 400);

    // 7. Connection status check after sending
    const statusSent = await request(`/network/status/${bId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('Status reflects pending_sent for requester', statusSent.body.data.status === 'pending_sent');

    const statusReceived = await request(`/network/status/${aId}`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Status reflects pending_received for recipient', statusReceived.body.data.status === 'pending_received');

    // 8. Pending requests lists
    const requestsA = await request('/network/requests', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('Requester sees sent request in requests list', requestsA.status === 200 && requestsA.body.data.sent.length >= 1);

    const requestsB = await request('/network/requests', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('Recipient sees received request in requests list', requestsB.status === 200 && requestsB.body.data.received.length >= 1);

    // 9. Cancel outgoing request
    console.log('\n--- Test Cancel & Reject Requests ---');
    const sendReqC = await request(`/network/connect/${cId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { note: 'Test cancel' },
    });
    assert('User A sends request to User C', sendReqC.status === 201);
    const connCId = sendReqC.body.data._id;

    const cancelRes = await request(`/network/cancel/${connCId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('User A cancels request to User C (200)', cancelRes.status === 200);

    // 10. Reject incoming request
    const sendCToB = await request(`/network/connect/${bId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userC.token}` },
      body: { note: 'Hi B' },
    });
    assert('User C sends request to User B', sendCToB.status === 201);
    const connCToBId = sendCToB.body.data._id;

    const rejectRes = await request(`/network/reject/${connCToBId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B rejects User C request (200)', rejectRes.status === 200);

    // 11. Accept incoming request
    console.log('\n--- Test Accept Connection ---');
    const acceptRes = await request(`/network/accept/${connId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B accepts User A connection request (200)', acceptRes.status === 200, JSON.stringify(acceptRes.body));
    assert('Connection status is accepted', acceptRes.body.data.status === 'accepted');

    // 12. Active connections list
    const connsA = await request('/network/connections', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('User A sees User B in active connections list', connsA.status === 200 && connsA.body.data.some((c) => c.partner._id === bId));

    const connsB = await request('/network/connections', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B sees User A in active connections list', connsB.status === 200 && connsB.body.data.some((c) => c.partner._id === aId));

    // 13. Status is now connected
    const statusConnected = await request(`/network/status/${bId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('Status between connected users is "connected"', statusConnected.body.data.status === 'connected');

    // 14. Start Conversation between connected users
    console.log('\n--- Test Real-Time Chat Engine ---');
    const chatInit = await request('/chat/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { recipientId: bId },
    });
    assert('Connected members can initiate conversation (200/201)', chatInit.status === 200, JSON.stringify(chatInit.body));
    const convId = chatInit.body.data._id;

    // 15. Retrieve conversation list
    const convsList = await request('/chat/conversations', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('Conversation list contains new conversation', convsList.status === 200 && convsList.body.data.some((c) => c._id === convId));

    // 16. Send message from User A to User B
    const sendMsg1 = await request(`/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { content: 'Hello Elena, excited to collaborate on Golden Circle!' },
    });
    assert('User A sends message (201)', sendMsg1.status === 201, JSON.stringify(sendMsg1.body));
    const msg1Id = sendMsg1.body.data._id;
    assert('Message content matches', sendMsg1.body.data.content.includes('excited to collaborate'));

    // 17. Unread counts
    const unreadB = await request('/chat/unread-count', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B has 1 unread message', unreadB.status === 200 && unreadB.body.data.unreadCount === 1);

    const unreadA = await request('/chat/unread-count', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('User A has 0 unread messages', unreadA.status === 200 && unreadA.body.data.unreadCount === 0);

    // 18. User B views messages
    const msgsB = await request(`/chat/conversations/${convId}/messages`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B retrieves conversation messages (200)', msgsB.status === 200 && msgsB.body.data.length >= 1);

    // 19. Security boundary: User C (stranger) attempts to read conversation
    const intruderMsgs = await request(`/chat/conversations/${convId}/messages`, {
      headers: { Authorization: `Bearer ${userC.token}` },
    });
    assert('Intruder non-participant blocked from reading messages (403)', intruderMsgs.status === 403);

    // 20. User B marks conversation as read
    const markRead = await request(`/chat/conversations/${convId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B marks conversation as read (200)', markRead.status === 200);

    const unreadBAfter = await request('/chat/unread-count', {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B unread count reset to 0', unreadBAfter.body.data.unreadCount === 0);

    // 21. Mute conversation
    console.log('\n--- Test Mute, Report & Block Controls ---');
    const muteRes = await request(`/chat/conversations/${convId}/mute`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('User A mutes conversation', muteRes.status === 200 && muteRes.body.data.isMuted === true);

    const unmuteRes = await request(`/chat/conversations/${convId}/mute`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('User A unmutes conversation', unmuteRes.status === 200 && unmuteRes.body.data.isMuted === false);

    // 22. Report message
    const reportMsg = await request(`/chat/messages/${msg1Id}/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: { reason: 'Testing report abusive message endpoint' },
    });
    assert('User reports message successfully (200)', reportMsg.status === 200);

    // 23. Block participant
    const blockRes = await request(`/chat/conversations/${convId}/block`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B blocks User A (200)', blockRes.status === 200 && blockRes.body.data.isBlocked === true);

    // User A cannot send message when blocked
    const blockedSend = await request(`/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { content: 'This message should be rejected because user is blocked' },
    });
    assert('Blocked participant rejected from sending messages (403)', blockedSend.status === 403);

    // Connection status reflects blocked
    const statusBlocked = await request(`/network/status/${bId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('Connection status reflects blocked', statusBlocked.body.data.status === 'blocked');

    // User B unblocks User A
    const unblockRes = await request(`/chat/conversations/${convId}/block`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert('User B unblocks User A (200)', unblockRes.status === 200 && unblockRes.body.data.isBlocked === false);

    // 24. Remove connection
    console.log('\n--- Test Remove Connection ---');
    const removeConn = await request(`/network/remove/${bId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('User A removes connection with User B (200)', removeConn.status === 200);

    const connsAfterRemove = await request('/network/connections', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert('User B no longer in User A connections list', !connsAfterRemove.body.data.some((c) => c.partner._id === bId));

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(`Phase 8 Test Suite Finished: ${passed} passed, ${failed} failed`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runNetworkSuite();
