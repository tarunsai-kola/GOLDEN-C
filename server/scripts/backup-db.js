/**
 * The Golden Circle - Database Backup & Recovery Script
 * Usage:
 *   node scripts/backup-db.js backup
 *   node scripts/backup-db.js restore <backup-dir-name>
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/golden-circle';
const BACKUPS_DIR = path.resolve(__dirname, '../backups');

const COLLECTIONS_TO_BACKUP = [
  'users',
  'organizations',
  'companyprofiles',
  'organizationmemberships',
  'organizationinvitations',
  'verificationrecords',
  'events',
  'eventregistrations',
  'jobs',
  'savedjobs',
  'jobreports',
  'connections',
  'conversations',
  'messages',
  'notifications',
  'notificationpreferences',
  'follows',
  'saveditems',
  'adminauditlogs',
  'editorialarticles',
  'platformconfigs',
];

async function backup() {
  console.log('🔄 Starting MongoDB Database Backup...');
  console.log(`Connecting to: ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}`);

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDir = path.join(BACKUPS_DIR, `backup-${timestamp}`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const manifest = {
    timestamp: new Date().toISOString(),
    database: db.databaseName,
    collections: {},
  };

  for (const collName of COLLECTIONS_TO_BACKUP) {
    try {
      const collection = db.collection(collName);
      const docs = await collection.find({}).toArray();
      const filePath = path.join(targetDir, `${collName}.json`);

      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      manifest.collections[collName] = docs.length;
      console.log(`  📦 Backed up: ${collName} (${docs.length} documents)`);
    } catch (err) {
      console.warn(`  ⚠️ Could not backup collection ${collName}: ${err.message}`);
    }
  }

  fs.writeFileSync(
    path.join(targetDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  console.log(`\n✅ Backup successfully completed! Stored in:\n   ${targetDir}`);
  await mongoose.disconnect();
}

async function restore(backupFolderName) {
  if (!backupFolderName) {
    console.error('❌ Please specify a backup directory name to restore.');
    console.log('Example: node scripts/backup-db.js restore backup-2026-11-14T16-30-00-000Z');
    process.exit(1);
  }

  const sourceDir = path.isAbsolute(backupFolderName)
    ? backupFolderName
    : path.join(BACKUPS_DIR, backupFolderName);

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Backup directory not found: ${sourceDir}`);
    process.exit(1);
  }

  console.log(`🔄 Starting MongoDB Database Restore from:\n   ${sourceDir}`);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');

  for (const file of files) {
    const collName = path.basename(file, '.json');
    const filePath = path.join(sourceDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const docs = JSON.parse(content);

    if (docs.length > 0) {
      const collection = db.collection(collName);
      // Clean and restore
      await collection.deleteMany({});
      // Convert string $oid and $date if needed
      await collection.insertMany(docs);
      console.log(`  📥 Restored: ${collName} (${docs.length} documents)`);
    } else {
      console.log(`  ⚪ Skipped empty collection: ${collName}`);
    }
  }

  console.log('\n✅ Database restore successfully completed!');
  await mongoose.disconnect();
}

const action = process.argv[2] || 'backup';

if (action === 'backup') {
  backup().catch((err) => {
    console.error('Fatal backup error:', err);
    process.exit(1);
  });
} else if (action === 'restore') {
  restore(process.argv[3]).catch((err) => {
    console.error('Fatal restore error:', err);
    process.exit(1);
  });
} else {
  console.log('Usage: node scripts/backup-db.js [backup|restore <folder>]');
}
