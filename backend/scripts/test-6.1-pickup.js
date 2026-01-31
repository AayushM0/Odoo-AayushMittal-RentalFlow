const pool = require('../src/config/database');
const pickupService = require('../src/services/pickup.service');
const orderService = require('../src/services/order.service');

async function setupTestData() {
  console.log('Setting up test data...\n');
  
  const vendorResult = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, state)
     VALUES ('testvendor@pickup.com', 'hash', 'VENDOR', 'Test Vendor', 'KARNATAKA')
     RETURNING id`
  );
  const vendorId = vendorResult.rows[0].id;
  
  const customerResult = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, state)
     VALUES ('testcustomer@pickup.com', 'hash', 'CUSTOMER', 'Test Customer', 'KARNATAKA')
     RETURNING id`
  );
  const customerId = customerResult.rows[0].id;
  
  const productResult = await pool.query(
    `INSERT INTO products (vendor_id, name, category, is_published)
     VALUES ($1, 'Test Camera', 'Electronics', true)
     RETURNING id`,
    [vendorId]
  );
  const productId = productResult.rows[0].id;
  
  const variantResult = await pool.query(
    `INSERT INTO variants (product_id, sku, price_daily, stock_quantity)
     VALUES ($1, 'CAM-TEST', 100, 5)
     RETURNING id`,
    [productId]
  );
  const variantId = variantResult.rows[0].id;
  
  const order = await orderService.createOrder(customerId, {
    vendorId,
    items: [
      {
        variantId,
        quantity: 1,
        startDate: '2026-02-01T10:00:00Z',
        endDate: '2026-02-05T10:00:00Z',
        price: 100,
        duration: 4
      }
    ]
  });
  
  await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2',
    ['CONFIRMED', order.id]
  );
  
  console.log('✅ Test data created');
  console.log(`   Vendor ID: ${vendorId}`);
  console.log(`   Customer ID: ${customerId}`);
  console.log(`   Order ID: ${order.id}`);
  console.log(`   Order Status: CONFIRMED\n`);
  
  return { vendorId, customerId, orderId: order.id };
}

async function testPickupWorkflow() {
  console.log('🧪 Testing Pickup Workflow\n');
  
  try {
    const { vendorId, orderId } = await setupTestData();
    
    console.log('--- Test 1: Get Pending Pickups ---');
    const pendingPickups = await pickupService.getPendingPickups(vendorId);
    console.log(`Found ${pendingPickups.length} pending pickup(s)`);
    console.assert(pendingPickups.length === 1, 'Should have 1 pending pickup');
    console.assert(pendingPickups[0].id === orderId, 'Order ID should match');
    console.log('✅ Pending pickups query passed\n');
    
    console.log('--- Test 2: Record Pickup ---');
    const pickupData = {
      orderId,
      pickedUpBy: 'John Doe',
      notes: 'Customer arrived on time. All items in good condition.'
    };
    
    const result = await pickupService.recordPickup(vendorId, 'VENDOR', pickupData);
    console.log('Pickup recorded:');
    console.log(`  Order Status: ${result.order.status}`);
    console.log(`  Pickups Created: ${result.pickups.length}`);
    console.assert(result.order.status === 'PICKED_UP', 'Order status should be PICKED_UP');
    console.assert(result.pickups.length > 0, 'Should create pickup records');
    console.log('✅ Pickup recording passed\n');
    
    console.log('--- Test 3: Verify Order Status Updated ---');
    const orderCheck = await pool.query(
      'SELECT status FROM orders WHERE id = $1',
      [orderId]
    );
    console.assert(orderCheck.rows[0].status === 'PICKED_UP', 'Order status in DB should be PICKED_UP');
    console.log('✅ Order status update verified\n');
    
    console.log('--- Test 4: Pending Pickups After Recording ---');
    const pendingAfter = await pickupService.getPendingPickups(vendorId);
    console.log(`Pending pickups now: ${pendingAfter.length}`);
    console.assert(pendingAfter.length === 0, 'Should have 0 pending pickups after recording');
    console.log('✅ Pending pickups correctly updated\n');
    
    console.log('--- Test 5: Get Pickup History ---');
    const history = await pickupService.getPickupHistory(vendorId);
    console.log(`History count: ${history.pickups.length}`);
    console.assert(history.pickups.length > 0, 'Should have pickup history');
    console.log('✅ Pickup history query passed\n');
    
    console.log('--- Test 6: Cannot Pickup Already Picked Up Order ---');
    try {
      await pickupService.recordPickup(vendorId, 'VENDOR', pickupData);
      console.log('❌ Should have thrown error');
    } catch (error) {
      console.assert(error.message.includes('PICKED_UP'), 'Should reject already picked up order');
      console.log('✅ Duplicate pickup prevention passed\n');
    }
    
    console.log('🎉 All pickup workflow tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@pickup.com']);
    await pool.end();
  }
}

testPickupWorkflow()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
