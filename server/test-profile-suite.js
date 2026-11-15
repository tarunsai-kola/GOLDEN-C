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
      location: 'Boston, MA',
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

async function runProfileTestSuite() {
  console.log('🧪 Starting Phase 4: Company Profile Experience & Studio Test Suite...\n');
  const now = Date.now();

  // 1. Setup users
  console.log('Step 1: Setting up Founder and Follower user accounts');
  const founder = await registerAndLogin('Dr. Sarah Lin', `sarah_${now}@quantum.bio`, 'Secure123!');
  const follower = await registerAndLogin('Alex Rivera', `alex_${now}@investor.com`, 'Secure123!');
  console.log('✅ Accounts ready.');

  // 2. Create organization
  console.log('\nStep 2: Create Organization "Quantum BioTech"');
  const createOrgRes = await request('/organizations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${founder.token}` },
    body: {
      name: `Quantum BioTech ${now}`,
      type: 'company',
      location: 'Boston, MA',
      website: 'https://quantumbio.tech',
      tagline: 'Programmable mRNA therapeutics accelerated by quantum computing',
      industry: 'Biotechnology',
      companyStage: 'Series B',
      teamSize: '51-200',
    },
  });
  if (createOrgRes.status !== 201) throw new Error('Create organization failed');
  const org = createOrgRes.body.data.organization;
  const orgId = org._id || org.id;
  console.log('✅ Organization created:', org.name, 'ID:', orgId);

  // 3. Test File Upload (Multipart Form-Data)
  console.log('\nStep 3: Test Image Upload POST /api/organizations/:id/upload');
  const boundary = `----WebKitFormBoundary${Date.now()}`;
  const fileContent = 'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;';
  const postData = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="sample-cover.gif"',
    'Content-Type: image/gif',
    '',
    fileContent,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const uploadRes = await request(`/organizations/${orgId}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${founder.token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: Buffer.from(postData, 'binary'),
  });

  console.log(`Status: ${uploadRes.status}`);
  if (uploadRes.status !== 201 || !uploadRes.body.data?.url) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadRes.body)}`);
  }
  const uploadedUrl = uploadRes.body.data.url;
  console.log('✅ File uploaded successfully. URL:', uploadedUrl);

  // 4. Get Studio Data
  console.log('\nStep 4: GET /api/organizations/:id/studio');
  const studioRes = await request(`/organizations/${orgId}/studio`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${founder.token}` },
  });
  console.log(`Status: ${studioRes.status}`);
  if (studioRes.status !== 200 || !studioRes.body.data.profile) {
    throw new Error('Get studio data failed');
  }
  console.log('✅ Studio data retrieved. Section count:', studioRes.body.data.profile.sectionOrder.length);

  // 5. Save Draft in Studio
  console.log('\nStep 5: PUT /api/organizations/:id/studio (Draft mode)');
  const draftRes = await request(`/organizations/${orgId}/studio`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${founder.token}` },
    body: {
      action: 'draft',
      mission: 'Drafting our 2030 moonshot mission statement.',
      problemSolved: 'Accelerating drug discovery cycles from 10 years to 6 months.',
    },
  });
  console.log(`Status: ${draftRes.status}`);
  if (draftRes.status !== 200 || !draftRes.body.data.profile.draftData) {
    throw new Error('Draft save failed');
  }
  console.log('✅ Draft saved successfully:', draftRes.body.data.profile.draftData.mission);

  // 6. Add Products to Company Profile
  console.log('\nStep 6: Add Products POST /api/organizations/:id/products');
  const productRes = await request(`/organizations/${orgId}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${founder.token}` },
    body: {
      name: 'BioSynthetix Q1',
      description: 'Quantum-accelerated protein folding simulation engine.',
      category: 'DeepTech Platform',
      link: 'https://quantumbio.tech/synthetix',
      status: 'GA / Live',
    },
  });
  console.log(`Status: ${productRes.status}`);
  if (productRes.status !== 201) throw new Error('Add product failed');
  const productId = productRes.body.data.id;
  console.log('✅ Product added with ID:', productId);

  // 7. Add Milestones to Company Profile
  console.log('\nStep 7: Add Milestones POST /api/organizations/:id/milestones');
  const milestoneRes = await request(`/organizations/${orgId}/milestones`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${founder.token}` },
    body: {
      title: 'FDA Fast Track Designation',
      description: 'Received Phase 1 accelerated clearance for lead oncology candidate.',
      date: 'Q3 2024',
      category: 'Regulatory',
    },
  });
  console.log(`Status: ${milestoneRes.status}`);
  if (milestoneRes.status !== 201) throw new Error('Add milestone failed');
  const milestoneId = milestoneRes.body.data.id;
  console.log('✅ Milestone added with ID:', milestoneId);

  // 8. Add Gallery Items to Company Profile
  console.log('\nStep 8: Add Gallery Item POST /api/organizations/:id/gallery');
  const galleryRes = await request(`/organizations/${orgId}/gallery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${founder.token}` },
    body: {
      url: uploadedUrl,
      caption: 'Boston R&D Quantum Wet Lab',
      category: 'office',
    },
  });
  console.log(`Status: ${galleryRes.status}`);
  if (galleryRes.status !== 201) throw new Error('Add gallery item failed');
  const imageId = galleryRes.body.data.id;
  console.log('✅ Gallery item added with ID:', imageId);

  // 9. Publish Studio Updates
  console.log('\nStep 9: Publish Studio Updates PUT /api/organizations/:id/studio');
  const publishRes = await request(`/organizations/${orgId}/studio`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${founder.token}` },
    body: {
      action: 'publish',
      coverImage: uploadedUrl,
      mission: 'Curing genetic disorders through molecular simulation at scale.',
      vision: 'A world free from hereditary cellular anomalies.',
      problemSolved: 'Drug development is slow and risky; we de-risk with quantum simulation.',
      targetAudience: 'Global pharmaceutical and oncology institutions.',
      contactInfo: {
        email: 'partnerships@quantumbio.tech',
        phone: '+1 617-555-0199',
        address: 'Kendall Square, Cambridge, MA',
        contactPerson: 'Dr. Sarah Lin',
      },
    },
  });
  console.log(`Status: ${publishRes.status}`);
  if (publishRes.status !== 200 || !publishRes.body.data.profile.isPublished) {
    throw new Error('Publish studio updates failed');
  }
  console.log('✅ Studio profile published live.');

  // 10. Public Profile Retrieval (Unauthenticated)
  console.log('\nStep 10: GET /api/organizations/:id/public-profile (Public visitor)');
  const publicProfRes = await request(`/organizations/${orgId}/public-profile`, { method: 'GET' });
  console.log(`Status: ${publicProfRes.status}`);
  if (publicProfRes.status !== 200) throw new Error('Public profile get failed');
  const pubData = publicProfRes.body.data;
  if (
    pubData.profile.products.length !== 1 ||
    pubData.profile.milestones.length !== 1 ||
    pubData.profile.gallery.length !== 1 ||
    pubData.followerCount !== 0 ||
    pubData.isFollowing !== false
  ) {
    throw new Error('Public profile data mismatch');
  }
  console.log('✅ Public profile aggregated successfully:');
  console.log(`- Company: ${pubData.organization.name}`);
  console.log(`- Products: ${pubData.profile.products.length}`);
  console.log(`- Milestones: ${pubData.profile.milestones.length}`);
  console.log(`- Gallery Photos: ${pubData.profile.gallery.length}`);
  console.log(`- Team Count: ${pubData.team.length}`);
  console.log(`- Followers: ${pubData.followerCount}`);

  // 11. Follow Organization as User 2
  console.log('\nStep 11: Follow Organization POST /api/organizations/:id/follow');
  const followRes = await request(`/organizations/${orgId}/follow`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${follower.token}` },
  });
  console.log(`Status: ${followRes.status}`);
  if (followRes.status !== 200 || followRes.body.data.followerCount !== 1) {
    throw new Error('Follow failed');
  }
  console.log('✅ Followed organization! Follower count:', followRes.body.data.followerCount);

  // 12. Check Public Profile as Follower
  console.log('\nStep 12: GET /api/organizations/:id/public-profile (As Follower)');
  const followerProfRes = await request(`/organizations/${orgId}/public-profile`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${follower.token}` },
  });
  if (
    followerProfRes.body.data.followerCount !== 1 ||
    followerProfRes.body.data.isFollowing !== true
  ) {
    throw new Error('Follower state not reflected in public profile');
  }
  console.log('✅ Profile correctly indicates isFollowing: true.');

  // 13. Unfollow Organization
  console.log('\nStep 13: Unfollow Organization DELETE /api/organizations/:id/follow');
  const unfollowRes = await request(`/organizations/${orgId}/follow`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${follower.token}` },
  });
  console.log(`Status: ${unfollowRes.status}`);
  if (unfollowRes.status !== 200 || unfollowRes.body.data.followerCount !== 0) {
    throw new Error('Unfollow failed');
  }
  console.log('✅ Unfollowed organization! Follower count:', unfollowRes.body.data.followerCount);

  // 14. Delete Gallery Item
  console.log('\nStep 14: DELETE /api/organizations/:id/gallery/:imageId');
  const delGalRes = await request(`/organizations/${orgId}/gallery/${imageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${founder.token}` },
  });
  console.log(`Status: ${delGalRes.status}`);
  if (delGalRes.status !== 200) throw new Error('Delete gallery item failed');
  console.log('✅ Gallery item deleted.');

  // 15. Delete Product
  console.log('\nStep 15: DELETE /api/organizations/:id/products/:productId');
  const delProdRes = await request(`/organizations/${orgId}/products/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${founder.token}` },
  });
  console.log(`Status: ${delProdRes.status}`);
  if (delProdRes.status !== 200) throw new Error('Delete product failed');
  console.log('✅ Product deleted.');

  // 16. Delete Milestone
  console.log('\nStep 16: DELETE /api/organizations/:id/milestones/:milestoneId');
  const delMileRes = await request(`/organizations/${orgId}/milestones/${milestoneId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${founder.token}` },
  });
  console.log(`Status: ${delMileRes.status}`);
  if (delMileRes.status !== 200) throw new Error('Delete milestone failed');
  console.log('✅ Milestone deleted.');

  // 17. Final Verification of Public Profile
  console.log('\nStep 17: Final Public Profile inspection after deletions');
  const finalProfRes = await request(`/organizations/${orgId}/public-profile`, { method: 'GET' });
  const finalData = finalProfRes.body.data;
  if (
    finalData.profile.products.length !== 0 ||
    finalData.profile.milestones.length !== 0 ||
    finalData.profile.gallery.length !== 0
  ) {
    throw new Error('Deletions were not reflected');
  }
  console.log('✅ Clean profile state confirmed after sub-resource operations.');

  console.log('\n🎉 ALL 17 COMPANY PROFILE & STUDIO TESTS PASSED WITH 100% SUCCESS!\n');
}

runProfileTestSuite().catch((err) => {
  console.error('\n❌ Profile test suite failed:', err);
  process.exit(1);
});
