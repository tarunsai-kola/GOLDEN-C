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

async function runDiscoverySuite() {
  console.log('🧪 Starting Phase 5: Advanced Startup Discovery Engine Test Suite...\n');
  const now = Date.now();

  // 1. Setup User
  console.log('Step 1: Setup Authenticated Explorer User');
  const explorer = await registerAndLogin('David Venture', `david_${now}@invest.vc`, 'Pass123!@#');
  console.log('✅ Explorer account ready.');

  // 2. Setup 3 Distinct Startups
  console.log('\nStep 2: Provisioning 3 Sample Startups for Testing Discovery');

  // Startup 1: Robotics
  const s1 = await request('/organizations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${explorer.token}` },
    body: {
      name: `NeuroVision Robotics ${now}`,
      location: 'Austin, TX',
      industry: 'Robotics',
      companyStage: 'Seed',
      foundedYear: 2023,
      teamSize: '11-50',
      tagline: 'Autonomous edge vision for warehouse and field robotic arms',
      description: 'Ultra-low-latency neural computing for dynamic physical obstacle avoidance.',
    },
  });
  const s1Id = s1.body.data.organization._id;
  // Set isHiring via studio publish
  await request(`/organizations/${s1Id}/studio`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${explorer.token}` },
    body: { action: 'publish', isHiring: true },
  });

  // Startup 2: Cybersecurity
  const s2 = await request('/organizations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${explorer.token}` },
    body: {
      name: `CyberShield Security ${now}`,
      location: 'New York, NY',
      industry: 'Cybersecurity',
      companyStage: 'Series A',
      foundedYear: 2021,
      teamSize: '51-200',
      tagline: 'Zero-trust perimeter protection with autonomous threat intelligence',
      description: 'Defending Fortune 500 clouds from state-sponsored APT intrusions.',
    },
  });
  const s2Id = s2.body.data.organization._id;
  await request(`/organizations/${s2Id}/studio`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${explorer.token}` },
    body: { action: 'publish', isHiring: false },
  });

  // Startup 3: CleanTech
  const s3 = await request('/organizations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${explorer.token}` },
    body: {
      name: `EcoVolt Energy ${now}`,
      location: 'San Francisco, CA',
      industry: 'CleanTech',
      companyStage: 'Series B',
      foundedYear: 2019,
      teamSize: '51-200',
      tagline: 'Next-generation solid-state lithium-air utility grid batteries',
      description: 'Zero carbon baseline power storage for megawatt microgrids.',
    },
  });
  const s3Id = s3.body.data.organization._id;
  await request(`/organizations/${s3Id}/studio`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${explorer.token}` },
    body: { action: 'publish', isHiring: true },
  });

  console.log('✅ Created 3 sample startups in different industries, stages, and locations.');

  // 3. Test Keyword Search across Name
  console.log('\nStep 3: Test Keyword Search: q=NeuroVision');
  const qRes1 = await request(`/discovery/startups?q=NeuroVision%20Robotics%20${now}`, { method: 'GET' });
  console.log(`Status: ${qRes1.status}`);
  if (qRes1.status !== 200 || qRes1.body.data.startups.length !== 1) {
    throw new Error('Keyword search by name failed');
  }
  console.log('✅ Name search returned exact match:', qRes1.body.data.startups[0].name);

  // 4. Test Keyword Search across Description / Tagline
  console.log('\nStep 4: Test Keyword Search: q=zero-trust');
  const qRes2 = await request(`/discovery/startups?q=zero-trust`, { method: 'GET' });
  if (qRes2.status !== 200 || qRes2.body.data.startups.length === 0) {
    throw new Error('Search across tagline/description failed');
  }
  const match2 = qRes2.body.data.startups.find((s) => s._id === s2Id);
  if (!match2) throw new Error('Startup 2 not found in zero-trust search');
  console.log('✅ Description/tagline search succeeded for:', match2.name);

  // 5. Test Multi-filter Combination (Industry + isHiring)
  console.log('\nStep 5: Multi-filter: industry=CleanTech & isHiring=true');
  const filterRes1 = await request(`/discovery/startups?industry=CleanTech&isHiring=true`, { method: 'GET' });
  if (filterRes1.status !== 200) throw new Error('Multi-filter failed');
  const ecoVoltMatch = filterRes1.body.data.startups.find((s) => s._id === s3Id);
  if (!ecoVoltMatch || ecoVoltMatch.isHiring !== true) {
    throw new Error('Industry + Hiring filter did not match expected EcoVolt');
  }
  console.log('✅ Matched CleanTech + Hiring startup:', ecoVoltMatch.name);

  // 6. Test Multi-stage Filter (comma-separated: Series A,Series B)
  console.log('\nStep 6: Multi-stage filter: stage=Series A,Series B');
  const stageRes = await request(`/discovery/startups?stage=Series%20A,Series%20B`, { method: 'GET' });
  const matchedStageIds = new Set(stageRes.body.data.startups.map((s) => s._id));
  if (!matchedStageIds.has(s2Id) || !matchedStageIds.has(s3Id)) {
    throw new Error('Multi-stage filter failed to return both Series A and Series B startups');
  }
  console.log('✅ Multi-stage filter matched expected startups.');

  // 7. Test Location Search
  console.log('\nStep 7: Location search: location=Austin');
  const locRes = await request(`/discovery/startups?location=Austin`, { method: 'GET' });
  const austinMatch = locRes.body.data.startups.find((s) => s._id === s1Id);
  if (!austinMatch) throw new Error('Location search for Austin failed');
  console.log('✅ Location search returned:', austinMatch.location);

  // 8. Test Founded Year Range (foundedFrom=2020 & foundedTo=2024)
  console.log('\nStep 8: Founded year filter: foundedFrom=2020 & foundedTo=2024');
  const yearRes = await request(`/discovery/startups?foundedFrom=2020&foundedTo=2024`, { method: 'GET' });
  const yearIds = new Set(yearRes.body.data.startups.map((s) => s._id));
  if (!yearIds.has(s1Id) || !yearIds.has(s2Id) || yearIds.has(s3Id)) {
    throw new Error('Founded year range filter failed (EcoVolt 2019 must be excluded)');
  }
  console.log('✅ Founded year filter correctly filtered out 2019 and kept 2021 & 2023.');

  // 9. Test Sorting (sort=name_asc)
  console.log('\nStep 9: Sorting: sort=name_asc');
  const sortRes = await request(`/discovery/startups?sort=name_asc&limit=20`, { method: 'GET' });
  const names = sortRes.body.data.startups.map((s) => s.name);
  const isSorted = names.slice(1).every((item, i) => names[i].localeCompare(item) <= 0);
  if (!isSorted) throw new Error('name_asc sorting was not strictly ascending');
  console.log('✅ Ascending alphabetical sort verified.');

  // 10. Test Pagination (page=1, limit=2)
  console.log('\nStep 10: Pagination: page=1, limit=2');
  const pageRes = await request(`/discovery/startups?page=1&limit=2`, { method: 'GET' });
  const pag = pageRes.body.data.pagination;
  if (pageRes.body.data.startups.length !== 2 || !pag.hasNext) {
    throw new Error('Pagination metadata / limit check failed');
  }
  console.log(`✅ Pagination verified: page ${pag.page} of ${pag.totalPages}, total: ${pag.total}`);

  // 11. Test Dynamic Filter Meta
  console.log('\nStep 11: GET /api/discovery/filters-meta');
  const metaRes = await request('/discovery/filters-meta', { method: 'GET' });
  console.log(`Status: ${metaRes.status}`);
  if (metaRes.status !== 200 || !metaRes.body.data.industries || !metaRes.body.data.stages) {
    throw new Error('Filter meta failed');
  }
  console.log('✅ Dynamic filter metadata retrieved:');
  console.log(`- Total Startups: ${metaRes.body.data.totalStartups}`);
  console.log(`- Hiring Startups: ${metaRes.body.data.hiringCount}`);
  console.log(`- Industries: ${metaRes.body.data.industries.length}`);
  console.log(`- Stages: ${metaRes.body.data.stages.length}`);

  // 12. Save / Bookmark Startup as Explorer
  console.log('\nStep 12: Bookmark startup POST /api/discovery/save/:id');
  const saveRes = await request(`/discovery/save/${s1Id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${explorer.token}` },
  });
  console.log(`Status: ${saveRes.status}`);
  if (saveRes.status !== 200 || !saveRes.body.data.isSaved) {
    throw new Error('Save startup failed');
  }
  console.log('✅ Startup bookmarked.');

  // 13. Verify isSaved flag on Startup Discovery listing with Auth
  console.log('\nStep 13: Verify isSaved on discovery search with Authorization token');
  const authedSearchRes = await request(`/discovery/startups?q=NeuroVision%20Robotics%20${now}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${explorer.token}` },
  });
  if (authedSearchRes.body.data.startups[0].isSaved !== true) {
    throw new Error('isSaved flag was not true for bookmarked startup');
  }
  console.log('✅ isSaved flag correctly reflected in discovery search results.');

  // 14. GET /api/discovery/saved
  console.log('\nStep 14: GET /api/discovery/saved');
  const savedListRes = await request('/discovery/saved', {
    method: 'GET',
    headers: { Authorization: `Bearer ${explorer.token}` },
  });
  console.log(`Status: ${savedListRes.status}`);
  if (savedListRes.status !== 200 || savedListRes.body.data.startups.length === 0) {
    throw new Error('Get saved startups list failed');
  }
  const savedItem = savedListRes.body.data.startups.find((s) => s._id === s1Id);
  if (!savedItem) throw new Error('Bookmarked startup not found in saved list');
  console.log('✅ Saved startups retrieved. Item:', savedItem.name);

  // 15. Unsave Startup
  console.log('\nStep 15: DELETE /api/discovery/save/:id');
  const unsaveRes = await request(`/discovery/save/${s1Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${explorer.token}` },
  });
  console.log(`Status: ${unsaveRes.status}`);
  if (unsaveRes.status !== 200 || unsaveRes.body.data.isSaved !== false) {
    throw new Error('Unsave startup failed');
  }
  console.log('✅ Startup un-saved.');

  // 16. Verify empty saved list
  console.log('\nStep 16: Verify removal from saved list');
  const afterSavedRes = await request('/discovery/saved', {
    method: 'GET',
    headers: { Authorization: `Bearer ${explorer.token}` },
  });
  const remainingMatch = afterSavedRes.body.data.startups.find((s) => s._id === s1Id);
  if (remainingMatch) throw new Error('Startup was not removed from saved list');
  console.log('✅ Confirmed removal from saved bookmarks.');

  console.log('\n🎉 ALL 16 STARTUP DISCOVERY ENGINE TESTS PASSED WITH 100% SUCCESS!\n');
}

runDiscoverySuite().catch((err) => {
  console.error('\n❌ Discovery test suite failed:', err);
  process.exit(1);
});
