// MovieDB Fix Script - Run: node fix.js
// This fixes the "no such column: sp.logo" error

const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'moviedb.db');

console.log('🔧 Fixing MovieDB database...\n');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Check streaming_platforms columns
const spCols = db.prepare("PRAGMA table_info(streaming_platforms)").all().map(c => c.name);
console.log('Current streaming_platforms columns:', spCols);

if (spCols.includes('icon') && !spCols.includes('logo')) {
  console.log('  ✏️  Adding "logo" column (copying from "icon")');
  db.exec('ALTER TABLE streaming_platforms ADD COLUMN logo TEXT');
  db.exec("UPDATE streaming_platforms SET logo = icon WHERE logo IS NULL");
}
if (spCols.includes('base_url') && !spCols.includes('website')) {
  console.log('  ✏️  Adding "website" column (copying from "base_url")');
  db.exec('ALTER TABLE streaming_platforms ADD COLUMN website TEXT');
  db.exec("UPDATE streaming_platforms SET website = base_url WHERE website IS NULL");
}

// Check reviews columns
const rvCols = db.prepare("PRAGMA table_info(reviews)").all().map(c => c.name);
console.log('\nCurrent reviews columns:', rvCols);

if (!rvCols.includes('headline')) {
  console.log('  ✏️  Adding "headline" column');
  db.exec('ALTER TABLE reviews ADD COLUMN headline TEXT');
}

// Verify fix
const finalSpCols = db.prepare("PRAGMA table_info(streaming_platforms)").all().map(c => c.name);
const finalRvCols = db.prepare("PRAGMA table_info(reviews)").all().map(c => c.name);
const movieCount = db.prepare("SELECT COUNT(*) as c FROM movies").get().c;

console.log('\n✅ Fixed streaming_platforms columns:', finalSpCols);
console.log('✅ Fixed reviews columns:', finalRvCols);
console.log('✅ Movies in database:', movieCount);

db.close();
console.log('\n🎬 Done! Now run: npm run dev');
