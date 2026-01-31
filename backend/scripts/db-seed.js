require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

const SEED_FILE = path.join(__dirname, '../src/database/seeds/dev_seed.sql');

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database...\n');
    
    const sql = fs.readFileSync(SEED_FILE, 'utf8');
    await client.query(sql);
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Sample credentials:');
    console.log('  Vendor: vendor@example.com / Test@123');
    console.log('  Customer: customer@example.com / Test@123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
