const pool = require('../src/config/database');

async function createPickupsTable() {
  try {
    console.log('Creating pickups table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pickups (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        picked_up_by VARCHAR(255) NOT NULL,
        notes TEXT,
        picked_up_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Pickups table created');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pickups_order_id ON pickups(order_id);
      CREATE INDEX IF NOT EXISTS idx_pickups_reservation_id ON pickups(reservation_id);
      CREATE INDEX IF NOT EXISTS idx_pickups_picked_up_at ON pickups(picked_up_at);
    `);
    
    console.log('✅ Indexes created');
    
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'pickups';
    `);
    
    console.log(`✅ Table verification: ${result.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

createPickupsTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
