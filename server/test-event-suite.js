const http = require('http');

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

  const verifyToken = reg.body.data.verificationToken;
  await request('/auth/verify-account', {
    method: 'POST',
    body: { token: verifyToken },
  });

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

async function runEventSuite() {
  console.log('🧪 Starting Phase 6: Events & Webinars Platform Test Suite...\n');
  const now = Date.now();

  const mongoose = require('mongoose');
  await mongoose.connect('mongodb://127.0.0.1:27017/golden-circle');

  // 1. Setup Users
  console.log('Step 1: Setting up Users (Admin, Organizer, Attendees)');
  const admin = await registerAndLogin('Admin Moderator', `admin_${now}@goldencircle.com`, 'AdminPass123!');
  const User = require('./src/models/user.model');
  await User.findByIdAndUpdate(admin.user._id, { role: 'admin' });
  // Re-login to get updated JWT role
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: `admin_${now}@goldencircle.com`, password: 'AdminPass123!' },
  });
  admin.token = adminLogin.body.data.accessToken;
  admin.user.role = 'admin';

  const organizer = await registerAndLogin('Rachel Founder', `rachel_${now}@apex.co`, 'Pass123!@#');
  const attendee1 = await registerAndLogin('Mark Explorer', `mark_${now}@gmail.com`, 'Pass123!@#');
  const attendee2 = await registerAndLogin('Lisa Investor', `lisa_${now}@vc.com`, 'Pass123!@#');
  console.log('✅ Accounts ready: Admin, Organizer, Attendee 1, Attendee 2.');

  // 2. Organizer creates Organization
  console.log('\nStep 2: Organizer creates Organization "Apex Ventures"');
  const orgRes = await request('/organizations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizer.token}` },
    body: {
      name: `Apex Ventures ${now}`,
      industry: 'Venture Capital',
      companyStage: 'Growth',
      location: 'San Francisco, CA',
      tagline: 'Backing world-changing AI and deeptech teams',
    },
  });
  const orgId = orgRes.body.data.organization._id;
  console.log('✅ Organization created with ID:', orgId);

  // 3. Organizer creates Event with Capacity = 1
  console.log('\nStep 3: Organizer submits Event with Capacity = 1');
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const createEventRes = await request('/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizer.token}` },
    body: {
      title: `AI Seed Pitch Showcase ${now}`,
      description: 'Exclusive pitch showcase featuring 10 tier-1 AI seed startups.',
      shortDescription: '10 seed startups pitching to leading venture funds.',
      category: 'Pitch Event',
      organizerType: 'Company',
      organizationId: orgId,
      date: tomorrow,
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      timeZone: 'PST',
      format: 'Online',
      meetingUrl: 'https://zoom.us/j/999888777?pwd=SuperSecretToken',
      pricingType: 'Free',
      capacity: 1, // Capacity is 1 to test waitlisting
      speakers: [
        {
          name: 'Rachel Founder',
          title: 'Managing Partner',
          company: 'Apex Ventures',
        },
      ],
    },
  });
  console.log(`Status: ${createEventRes.status}`);
  if (createEventRes.status !== 201) throw new Error('Create event failed');
  const event = createEventRes.body.data;
  const eventId = event._id;
  const eventSlug = event.slug;
  if (event.status !== 'Submitted') throw new Error(`Expected Submitted status, got ${event.status}`);
  console.log('✅ Event created with status: "Submitted" (Moderation queue pending)');

  // 4. Admin inspects Moderation Queue
  console.log('\nStep 4: Admin checks GET /api/events/moderation queue');
  const modRes = await request('/events/moderation', {
    method: 'GET',
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  console.log(`Status: ${modRes.status}`);
  if (modRes.status !== 200 || !modRes.body.data.some((e) => e._id === eventId)) {
    throw new Error('Submitted event not found in admin moderation queue');
  }
  console.log('✅ Admin sees event in moderation queue.');

  // 5. Admin Approves and Publishes Event
  console.log('\nStep 5: Admin approves and publishes event');
  const approveRes = await request(`/events/${eventId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${admin.token}` },
    body: { status: 'Published' },
  });
  console.log(`Status: ${approveRes.status}`);
  if (approveRes.status !== 200 || approveRes.body.data.status !== 'Published') {
    throw new Error('Admin approval failed');
  }
  console.log('✅ Event is now Published and live.');

  // 6. Admin creates an official Golden Circle Masterclass
  console.log('\nStep 6: Admin creates Golden Circle Official Masterclass');
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const officialRes = await request('/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin.token}` },
    body: {
      title: `Scale to Series A Masterclass ${now}`,
      description: 'Foundational framework on unit economics, enterprise sales, and investor readiness.',
      category: 'Masterclass',
      organizerType: 'Golden Circle',
      date: nextWeek,
      startTime: '2:00 PM',
      format: 'Online',
      pricingType: 'Free',
      capacity: 500,
      meetingUrl: 'https://goldencircle.io/live/masterclass-series-a',
    },
  });
  if (officialRes.status !== 201 || officialRes.body.data.organizerType !== 'Golden Circle') {
    throw new Error('Golden Circle official event creation failed');
  }
  console.log('✅ Golden Circle Official Event created with immediate Published status.');

  // 7. Security Constraint: Non-admin tries to create Golden Circle Official event (403 Forbidden)
  console.log('\nStep 7: Security check - Non-admin attempts to create Golden Circle Official event (expect 403)');
  const badOfficialRes = await request('/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizer.token}` },
    body: {
      title: 'Fake Official Event',
      description: 'Unauthorized official attempt.',
      category: 'Masterclass',
      organizerType: 'Golden Circle',
      date: nextWeek,
      startTime: '10:00 AM',
    },
  });
  console.log(`Status: ${badOfficialRes.status} (expected 403)`);
  if (badOfficialRes.status !== 403) {
    throw new Error('Non-admin was allowed to create official event');
  }
  console.log('✅ Non-admin correctly forbidden from creating Golden Circle Official event (403).');

  // 8. Public Discovery Query
  console.log('\nStep 8: Public Discovery GET /api/events?category=Pitch Event');
  const pubEventsRes = await request('/events?category=Pitch%20Event', { method: 'GET' });
  console.log(`Status: ${pubEventsRes.status}`);
  if (pubEventsRes.status !== 200 || pubEventsRes.body.data.events.length === 0) {
    throw new Error('Discovery query failed to find pitch event');
  }
  console.log('✅ Found published pitch event:', pubEventsRes.body.data.events[0].title);

  // 9. Official Only Filter
  console.log('\nStep 9: Filter: officialOnly=true');
  const officialListRes = await request('/events?officialOnly=true', { method: 'GET' });
  if (officialListRes.status !== 200 || !officialListRes.body.data.events.every((e) => e.organizerType === 'Golden Circle')) {
    throw new Error('officialOnly filter did not return strictly Golden Circle events');
  }
  console.log('✅ officialOnly filter verified.');

  // 10. Privacy check: Meeting URL hidden before registration
  console.log('\nStep 10: Privacy Check - Meeting URL hidden from unconfirmed visitors');
  const publicDetailRes = await request(`/events/${eventSlug}`, { method: 'GET' });
  if (publicDetailRes.body.data.event.meetingUrl !== '') {
    throw new Error('Meeting URL was leaked to unconfirmed visitor');
  }
  console.log('✅ Meeting URL is securely hidden for non-registered viewers.');

  // 11. Attendee 1 Registers (Seat 1 of 1 -> Confirmed)
  console.log('\nStep 11: Attendee 1 registers (Capacity 1 -> Confirmed)');
  const reg1Res = await request(`/events/${eventId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${attendee1.token}` },
    body: { answers: { background: 'AI Engineer' } },
  });
  console.log(`Status: ${reg1Res.status}`);
  if (reg1Res.status !== 200 || reg1Res.body.data.status !== 'confirmed') {
    throw new Error(`Attendee 1 was not confirmed: ${JSON.stringify(reg1Res.body)}`);
  }
  console.log('✅ Attendee 1 confirmed.');

  // Meeting URL now revealed for Attendee 1
  const authedDetailRes = await request(`/events/${eventSlug}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${attendee1.token}` },
  });
  if (!authedDetailRes.body.data.event.meetingUrl.includes('SuperSecretToken')) {
    throw new Error('Meeting URL was not revealed for confirmed attendee');
  }
  console.log('✅ Meeting URL securely revealed to confirmed Attendee 1.');

  // 12. Attendee 2 Registers (Capacity reached -> Waitlisted)
  console.log('\nStep 12: Attendee 2 registers (Capacity Full -> Waitlisted)');
  const reg2Res = await request(`/events/${eventId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${attendee2.token}` },
  });
  console.log(`Status: ${reg2Res.status}`);
  if (reg2Res.status !== 200 || reg2Res.body.data.status !== 'waitlisted') {
    throw new Error(`Attendee 2 was not waitlisted: ${JSON.stringify(reg2Res.body)}`);
  }
  console.log('✅ Attendee 2 successfully placed on Waitlist.');

  // 13. Public Attendees List
  console.log('\nStep 13: GET /api/events/:id/attendees');
  const attendeesRes = await request(`/events/${eventId}/attendees`, { method: 'GET' });
  console.log(`Status: ${attendeesRes.status}`);
  if (attendeesRes.status !== 200 || attendeesRes.body.data.length !== 1) {
    throw new Error('Expected 1 confirmed attendee in public list');
  }
  console.log('✅ Confirmed attendee roster verified:', attendeesRes.body.data[0].user.fullName);

  // 14. Check My Registrations
  console.log('\nStep 14: GET /api/events/my-registrations as Attendee 1');
  const myRegsRes = await request('/events/my-registrations', {
    method: 'GET',
    headers: { Authorization: `Bearer ${attendee1.token}` },
  });
  if (myRegsRes.status !== 200 || myRegsRes.body.data.length === 0) {
    throw new Error('My registrations failed');
  }
  console.log('✅ User sees their registered ticket for:', myRegsRes.body.data[0].event.title);

  // 15. Attendee 1 Cancels -> Auto-promote Attendee 2 to Confirmed!
  console.log('\nStep 15: Attendee 1 cancels registration -> Attendee 2 auto-promoted');
  const cancelRes = await request(`/events/${eventId}/register`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${attendee1.token}` },
  });
  console.log(`Status: ${cancelRes.status}`);
  if (cancelRes.status !== 200) throw new Error('Cancellation failed');

  // Verify Attendee 2 is now confirmed
  const attendee2StatusRes = await request(`/events/${eventSlug}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${attendee2.token}` },
  });
  if (attendee2StatusRes.body.data.myRegistration?.status !== 'confirmed') {
    throw new Error('Attendee 2 was not promoted to confirmed status');
  }
  console.log('✅ Waitlist auto-promotion verified: Attendee 2 is now confirmed.');

  // 16. Attendee 2 submits Feedback
  console.log('\nStep 16: Attendee 2 submits Feedback & Star Rating');
  const feedbackRes = await request(`/events/${eventId}/feedback`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${attendee2.token}` },
    body: {
      rating: 5,
      comment: 'Outstanding pitch event, connected with 3 high-conviction founders!',
    },
  });
  console.log(`Status: ${feedbackRes.status}`);
  if (feedbackRes.status !== 201 || feedbackRes.body.data.rating !== 5) {
    throw new Error('Feedback submission failed');
  }
  console.log('✅ Feedback submitted successfully (5 stars).');

  // 17. Non-attendee attempts feedback (expect 403)
  console.log('\nStep 17: Security check - Non-attendee attempts feedback (expect 403)');
  const badFeedbackRes = await request(`/events/${eventId}/feedback`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${attendee1.token}` },
    body: { rating: 1, comment: 'I cancelled but want to rate' },
  });
  console.log(`Status: ${badFeedbackRes.status} (expected 403)`);
  if (badFeedbackRes.status !== 403) {
    throw new Error('Non-attendee was allowed to submit feedback');
  }
  console.log('✅ Non-attendee forbidden from submitting feedback (403).');

  await mongoose.connection.close();

  console.log('\n🎉 ALL 17 EVENTS & WEBINARS TESTS PASSED WITH 100% SUCCESS!\n');
}

runEventSuite().catch((err) => {
  console.error('\n❌ Event test suite failed:', err);
  process.exit(1);
});
