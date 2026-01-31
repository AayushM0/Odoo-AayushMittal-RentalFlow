const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME_TEST || 'rental_erp_test',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pool;

/**
 * Get test database connection pool
 */
function getTestDb() {
  if (!pool) {
    pool = new Pool(testDbConfig);
  }
  return pool;
}

/**
 * Setup test database - run all migrations
 */
async function setupTestDatabase() {
  const db = getTestDb();
  
  console.log('🔧 Setting up test database...');
  
  try {
    // Read all migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split by semicolon and filter empty statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement) {
          await db.query(statement);
        }
      }
      
      console.log(`  ✅ Executed ${file}`);
    }
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup error:', error.message);
    throw error;
  }
}

/**
 * Clean test database - truncate all tables
 */
async function cleanTestDatabase() {
  const db = getTestDb();
  
  try {
    // Disable foreign key checks
    await db.query('SET session_replication_role = replica');
    
    // Truncate all tables in reverse order of dependencies
    const tables = [
      'audit_logs',
      'notifications',
      'payments',
      'invoices',
      'returns',
      'pickups',
      'order_items',
      'orders',
      'quotations',
      'reservations',
      'variants',
      'products',
      'users'
    ];
    
    for (const table of tables) {
      try {
        await db.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      } catch (error) {
        // Table might not exist, continue
        if (!error.message.includes('does not exist')) {
          console.warn(`Warning: Could not truncate ${table}:`, error.message);
        }
      }
    }
    
    // Re-enable foreign key checks
    await db.query('SET session_replication_role = DEFAULT');
    
    console.log('🧹 Test database cleaned');
  } catch (error) {
    console.error('❌ Clean database error:', error.message);
    throw error;
  }
}

/**
 * Reset sequences to 1
 */
async function resetSequences() {
  const db = getTestDb();
  
  try {
    const result = await db.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);
    
    for (const row of result.rows) {
      await db.query(`ALTER SEQUENCE ${row.sequence_name} RESTART WITH 1`);
    }
    
    console.log('🔄 Sequences reset');
  } catch (error) {
    console.error('❌ Reset sequences error:', error.message);
  }
}

/**
 * Close test database connection
 */
async function closeTestDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Test database connection closed');
  }
}

/**
 * Drop all tables (for complete reset)
 */
async function dropAllTables() {
  const db = getTestDb();
  
  try {
    await db.query('DROP SCHEMA public CASCADE');
    await db.query('CREATE SCHEMA public');
    await db.query('GRANT ALL ON SCHEMA public TO postgres');
    await db.query('GRANT ALL ON SCHEMA public TO public');
    
    console.log('🗑️  All tables dropped');
  } catch (error) {
    console.error('❌ Drop tables error:', error.message);
    throw error;
  }
}

/**
 * Execute raw query on test database
 */
async function query(sql, params = []) {
  const db = getTestDb();
  return db.query(sql, params);
}

module.exports = {
  getTestDb,
  setupTestDatabase,
  cleanTestDatabase,
  resetSequences,
  closeTestDatabase,
  dropAllTables,
  query
};
