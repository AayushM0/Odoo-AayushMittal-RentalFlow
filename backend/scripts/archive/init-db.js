#!/usr/bin/env node
/**
 * Database Initialization Script
 * This script initializes the PostgreSQL database with all required tables
 * 
 * Usage: node scripts/init-db.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'rental_erp',
  user: process.env.DB_USER || 'rental_user',
  password: process.env.DB_PASSWORD || 'rental_password_123',
});

async function initDatabase() {
  console.log('🚀 Starting database initialization...\n');

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database successfully');

    // Read and execute SQL setup file
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ setup-database.sql not found!');
      console.log('Expected location:', sqlFilePath);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL by statements and execute (skip comments and empty lines)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📋 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip connection commands and certain PostgreSQL-specific commands
      if (statement.startsWith('\\c') || 
          statement.startsWith('\\d') || 
          statement.startsWith('SELECT \'')) {
        continue;
      }

      try {
        await client.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        // Some statements might fail if objects already exist - that's okay
        if (err.code === '42P07' || // relation already exists
            err.code === '42710' || // object already exists
            err.code === '42P06') {  // schema already exists
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, err.message);
        }
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying table creation...\n');
    
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Tables created:');
      tableCheck.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found');
    }

    client.release();
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Start backend: npm run dev');
    console.log('  2. Test connection: node scripts/test-db-connection.js');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting:');
      console.log('  - Is PostgreSQL running? Check with: pg_isready');
      console.log('  - Is the database created? Run: sudo -u postgres psql < setup-database.sql');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Check your .env file credentials.');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Run: sudo -u postgres psql < setup-database.sql');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initDatabase();
