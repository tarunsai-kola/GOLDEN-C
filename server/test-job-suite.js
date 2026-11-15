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

async function runJobSuite() {
  console.log('====================================================');
  console.log('🧪 THE GOLDEN CIRCLE - PHASE 7: JOBS PLATFORM TEST SUITE');
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
    // 1. Setup users
    console.log('\n--- Setup Users & Organization ---');
    const founder = await registerAndLogin('Alex Recruiter', `alex_${ts}@techcorp.io`, 'StrongPass123!');
    const candidate = await registerAndLogin('Sam Candidate', `sam_${ts}@talenthub.com`, 'StrongPass123!');
    const outsider = await registerAndLogin('Oscar Outsider', `oscar_${ts}@outsider.com`, 'StrongPass123!');

    assert('Users registered & logged in successfully', !!founder.token && !!candidate.token && !!outsider.token);

    // 2. Create organization
    const orgRes = await request('/organizations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${founder.token}` },
      body: {
        name: `NeuralPulse AI ${ts}`,
        type: 'company',
        industry: 'Artificial Intelligence',
        description: 'Building next generation cognitive AI systems',
        website: 'https://neuralpulse.ai',
        location: 'San Francisco, CA',
      },
    });
    assert('Company organization created', orgRes.status === 201, JSON.stringify(orgRes.body));
    const orgId = (orgRes.body.data.organization || orgRes.body.data)._id;

    // 3. Unauthorized job creation check
    console.log('\n--- Test Permission Boundaries ---');
    const unauthorizedJobRes = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${outsider.token}` },
      body: {
        title: 'Unauthorized Engineer Opening',
        organizationId: orgId,
        description: 'This attempt should be rejected because user is not a recruiter/owner in this org.',
        employmentType: 'Full-time',
        workplaceType: 'Remote',
        applicationUrl: 'https://neuralpulse.ai/apply',
      },
    });
    assert('Unauthorized non-member rejected from posting job (403)', unauthorizedJobRes.status === 403);

    // 4. Authorized job creation (Job 1: Full-time Senior Engineer)
    console.log('\n--- Test Job Creation & Slugs ---');
    const job1Res = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${founder.token}` },
      body: {
        title: `Senior Full-Stack Engineer ${ts}`,
        organizationId: orgId,
        description: 'We are seeking a seasoned full-stack engineer with React and Node.js expertise.',
        employmentType: 'Full-time',
        workplaceType: 'Remote',
        location: 'San Francisco or Remote',
        experience: 'Senior',
        salary: {
          currency: 'USD',
          min: 150000,
          max: 190000,
          period: 'yearly',
          equity: '0.25% - 0.75%',
          isDisclosed: true,
        },
        requiredSkills: ['Node.js', 'React', 'MongoDB', 'TypeScript'],
        perks: ['Unlimited PTO', 'Health Insurance', 'Remote Stipend'],
        applicationType: 'external_url',
        applicationUrl: 'https://neuralpulse.ai/careers/senior-engineer',
      },
    });
    assert('Authorized founder creates Senior Engineer job (201)', job1Res.status === 201, JSON.stringify(job1Res.body));
    const job1 = job1Res.body.data;
    assert('Job has generated slug', !!job1.slug && job1.slug.includes('senior-full-stack-engineer'));
    assert('Job has viewsCount and clicksCount initialized to 0', job1.viewsCount === 0 && job1.clicksCount === 0);

    // 5. Create Job 2: AI Internship (Hybrid, Mid/Entry)
    const job2Res = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${founder.token}` },
      body: {
        title: `AI Research Intern ${ts}`,
        organizationId: orgId,
        description: 'Join our research team to build and evaluate deep learning foundation models.',
        employmentType: 'Internship',
        workplaceType: 'Hybrid',
        location: 'San Francisco, CA',
        experience: 'Entry',
        salary: {
          currency: 'USD',
          min: 8000,
          max: 10000,
          period: 'monthly',
          isDisclosed: true,
        },
        requiredSkills: ['Python', 'PyTorch', 'Transformers'],
        perks: ['Mentorship', 'Free Lunch', 'GPU Compute Access'],
        applicationType: 'external_url',
        applicationUrl: 'https://neuralpulse.ai/careers/ai-intern',
      },
    });
    assert('Authorized founder creates AI Intern job (201)', job2Res.status === 201);
    const job2 = job2Res.body.data;

    // 6. Public Job Discovery
    console.log('\n--- Test Job Discovery & Search ---');
    const discoveryAll = await request('/jobs');
    assert('Discovery list returns 200', discoveryAll.status === 200);
    assert('Discovery list includes newly posted jobs', discoveryAll.body.data.length >= 2);
    assert('Pagination metadata is present', !!discoveryAll.body.meta && discoveryAll.body.meta.total >= 2);

    // 7. Filter by employmentType
    const filterIntern = await request('/jobs?employmentType=Internship');
    assert('Filter by employmentType=Internship works', filterIntern.status === 200 && filterIntern.body.data.some((j) => j._id === job2._id));

    // 8. Filter by workplaceType
    const filterRemote = await request('/jobs?workplaceType=Remote');
    assert('Filter by workplaceType=Remote works', filterRemote.status === 200 && filterRemote.body.data.some((j) => j._id === job1._id));

    // 9. Keyword search (q=Full-Stack)
    const searchRes = await request(`/jobs?q=Full-Stack`);
    assert('Keyword search q=Full-Stack returns job1', searchRes.status === 200 && searchRes.body.data.some((j) => j._id === job1._id));

    // 10. Filter by isEquity=true
    const equityRes = await request('/jobs?isEquity=true');
    assert('Filter by isEquity=true returns job with equity', equityRes.status === 200 && equityRes.body.data.some((j) => j._id === job1._id));

    // 11. View single job by slug and check view count increment
    console.log('\n--- Test Single Job Presentation & Views ---');
    const singleJobRes = await request(`/jobs/${job1.slug}`, {
      headers: { Authorization: `Bearer ${candidate.token}` },
    });
    assert('Get single job by slug returns 200', singleJobRes.status === 200, JSON.stringify(singleJobRes.body));
    assert('Views count incremented to 1', singleJobRes.body.data.viewsCount === 1);
    assert('Organization details populated', singleJobRes.body.data.organizationId && singleJobRes.body.data.organizationId.name.includes('NeuralPulse AI'));
    assert('Initial isSaved is false for candidate', singleJobRes.body.data.isSaved === false);

    // 12. Candidate clicks apply
    console.log('\n--- Test Application Click Tracking ---');
    const applyRes = await request(`/jobs/${job1._id}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidate.token}` },
    });
    assert('Apply click returns applicationUrl', applyRes.status === 200 && applyRes.body.data.applicationUrl === 'https://neuralpulse.ai/careers/senior-engineer');
    assert('Clicks count incremented to 1', applyRes.body.data.clicksCount === 1);

    // 13. Candidate bookmarks / saves job
    console.log('\n--- Test Bookmarking / Saved Jobs ---');
    const saveRes = await request(`/jobs/${job1._id}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidate.token}` },
    });
    assert('Candidate saves job successfully', saveRes.status === 200 && saveRes.body.data.isSaved === true);

    // 14. Candidate retrieves saved jobs
    const getSavedRes = await request('/jobs/saved', {
      headers: { Authorization: `Bearer ${candidate.token}` },
    });
    assert('Candidate retrieves saved jobs (200)', getSavedRes.status === 200);
    assert('Saved jobs contains job1', getSavedRes.body.data.some((j) => j._id === job1._id));

    // 15. Candidate views job1 again, isSaved should be true
    const singleJobSavedRes = await request(`/jobs/${job1._id}`, {
      headers: { Authorization: `Bearer ${candidate.token}` },
    });
    assert('Job details returns isSaved: true', singleJobSavedRes.body.data.isSaved === true);

    // 16. Candidate un-saves job
    const unsaveRes = await request(`/jobs/${job1._id}/save`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${candidate.token}` },
    });
    assert('Candidate unsaves job successfully', unsaveRes.status === 200 && unsaveRes.body.data.isSaved === false);

    // 17. Candidate reports job
    console.log('\n--- Test Job Reporting ---');
    const reportRes = await request(`/jobs/${job1._id}/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidate.token}` },
      body: {
        reason: 'Misleading salary information',
        details: 'Testing reporting functionality for moderation queue.',
      },
    });
    assert('Candidate reports job successfully (201)', reportRes.status === 201, JSON.stringify(reportRes.body));
    assert('Report status is pending', reportRes.body.data.status === 'pending');

    // 18. Founder updates job details
    console.log('\n--- Test Job Update & Status Management ---');
    const updateRes = await request(`/jobs/${job1._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${founder.token}` },
      body: {
        title: `Lead Full-Stack Architect ${ts}`,
        experience: 'Lead',
      },
    });
    assert('Founder updates job title & experience (200)', updateRes.status === 200 && updateRes.body.data.experience === 'Lead');

    // 19. Founder updates job status to Closed
    const closeRes = await request(`/jobs/${job1._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${founder.token}` },
      body: { status: 'Closed' },
    });
    assert('Founder closes job status (200)', closeRes.status === 200 && closeRes.body.data.status === 'Closed');

    // 20. Public discovery excludes Closed job
    const discoveryAfterClose = await request('/jobs');
    assert('Public discovery excludes closed job', !discoveryAfterClose.body.data.some((j) => j._id === job1._id));

    // 21. Company jobs endpoint returns all jobs to company owner
    const companyJobsOwner = await request(`/jobs/organization/${orgId}`, {
      headers: { Authorization: `Bearer ${founder.token}` },
    });
    assert('Company owner sees all jobs including Closed (200)', companyJobsOwner.status === 200 && companyJobsOwner.body.data.some((j) => j._id === job1._id));

    // 22. Company jobs endpoint returns only active published jobs to public visitor
    const companyJobsPublic = await request(`/jobs/organization/${orgId}`);
    assert('Public visitor does NOT see Closed job in company jobs', companyJobsPublic.status === 200 && !companyJobsPublic.body.data.some((j) => j._id === job1._id) && companyJobsPublic.body.data.some((j) => j._id === job2._id));

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(`Phase 7 Test Suite Finished: ${passed} passed, ${failed} failed`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runJobSuite();
