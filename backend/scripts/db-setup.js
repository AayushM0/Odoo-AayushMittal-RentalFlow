require('dotenv').config();
const { execSync } = require('child_process');
const pool = require('../src/config/database');

async function setupDatabase() {
  console.log('🔧 Database Setup Starting...\n');
  
  const client = await pool.connect();
  
  try {
    // Drop all tables (reset)
    console.log('🗑️  Dropping existing tables...');
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log('✅ Tables dropped\n');
    
    client.release();
    await pool.end();
    
    // Run migrations
    console.log('📦 Running migrations...');
    execSync('npm run db:migrate', { stdio: 'inherit' });
    
    // Seed data
    console.log('\n🌱 Seeding database...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
