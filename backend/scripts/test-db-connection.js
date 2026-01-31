require('dotenv').config();
const pool = require('../src/config/database');

async function testConnection() {
  console.log('🧪 Testing Database Connection...\n');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT version()');
    console.log('✅ PostgreSQL Version:', result.rows[0].version);
    
    const dbResult = await client.query('SELECT current_database()');
    console.log('✅ Connected to database:', dbResult.rows[0].current_database);
    
    const userResult = await client.query('SELECT current_user');
    console.log('✅ Connected as user:', userResult.rows[0].current_user);
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table exists');
      
      // Check for category column
      const columnCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'category'
      `);
      
      if (columnCheck.rows.length > 0) {
        console.log('✅ Category column exists:', columnCheck.rows[0].data_type);
      }
      
      const countResult = await client.query('SELECT COUNT(*) FROM users');
      console.log(`✅ Current user count: ${countResult.rows[0].count}`);
    } else {
      console.log('⚠️  Users table does not exist yet');
    }
    
    client.release();
    
    console.log('\n🎉 Database is ready!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check if PostgreSQL is running: pg_isready');
    console.error('   2. Verify credentials in .env file');
    console.error('   3. Run setup script: cd scripts && sudo -u postgres psql < setup-database.sql');
    process.exit(1);
  }
}

testConnection();
