const mongoose = require('mongoose');
const User = require('../models/user.model');
const { config } = require('../config/env');

async function seed() {
  await mongoose.connect(config.MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  const accounts = [
    {
      email: 'admin@goldencircle.io',
      fullName: 'Super Administrator',
      password: 'AdminPassword123!',
      role: 'admin',
      staffRole: 'super_admin',
      status: 'active',
      isEmailVerified: true,
      headline: 'Platform Administrator',
    },
    {
      email: 'user@goldencircle.io',
      fullName: 'Alex Founder',
      password: 'UserPassword123!',
      role: 'user',
      status: 'active',
      isEmailVerified: true,
      headline: 'Serial Tech Founder & Venture Builder',
      intro: 'Building next-generation distributed systems and venture scale products.',
      timeCommitment: 'Full time',
      lookingFor: 'A co-founder for my idea',
      workCovers: ['Engineering', 'Product'],
    },
    {
      email: 'investor@goldencircle.io',
      fullName: 'Sarah Angel Syndicate',
      password: 'InvestorPassword123!',
      role: 'user',
      status: 'active',
      isEmailVerified: true,
      headline: 'Early-stage Angel & Startup Operator',
      intro: 'Backing ambitious technical teams across AI, SaaS, and infrastructure.',
      timeCommitment: 'Part time',
      lookingFor: 'An idea to join',
      workCovers: ['Finance', 'Product'],
    },
  ];

  for (const acc of accounts) {
    let user = await User.findOne({ email: acc.email });
    if (!user) {
      user = new User(acc);
    } else {
      Object.assign(user, acc);
    }
    await user.save();
    console.log(`[OK] Configured ${acc.email} (${acc.role})`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = seed;
