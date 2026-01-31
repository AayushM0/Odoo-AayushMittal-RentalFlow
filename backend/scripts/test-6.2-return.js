const pool = require('../src/config/database');
const returnService = require('../src/services/return.service');

async function setupTestData() {
  console.log('Setting up test data...\n');
  
  const vendorResult = await pool.query(
    `INSERT INTO users (email, password_hash, role, name)
     VALUES ('vendor@return.com', 'hash', 'VENDOR', 'Test Vendor')
     RETURNING id`
  );
  const vendorId = vendorResult.rows[0].id;
  
  const customerResult = await pool.query(
    `INSERT INTO users (email, password_hash, role, name)
     VALUES ('customer@return.com', 'hash', 'CUSTOMER', 'Test Customer')
     RETURNING id`
  );
  const customerId = customerResult.rows[0].id;
  
  const productResult = await pool.query(
    `INSERT INTO products (vendor_id, name, category, is_published)
     VALUES ($1, 'Test Equipment', 'Electronics', true)
     RETURNING id`,
    [vendorId]
  );
  const productId = productResult.rows[0].id;
  
  const variantResult = await pool.query(
    `INSERT INTO variants (product_id, sku, price_daily, stock_quantity)
     VALUES ($1, 'EQUIP-TEST', 200, 5)
     RETURNING id`,
    [productId]
  );
  const variantId = variantResult.rows[0].id;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const today = new Date();
  
  const orderResult = await pool.query(
    `INSERT INTO orders (customer_id, vendor_id, order_number, total_amount, start_date, end_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      customerId,
      vendorId,
      'ORD-TEST-001',
      200,
      yesterday,
      today,
      'PICKED_UP'
    ]
  );
  const orderId = orderResult.rows[0].id;
  
  const reservationResult = await pool.query(
    `INSERT INTO reservations (order_id, variant_id, start_date, end_date, quantity, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [orderId, variantId, yesterday, today, 1, 'ACTIVE']
  );
  const reservationId = reservationResult.rows[0].id;
  
  const pickupResult = await pool.query(
    `INSERT INTO pickups (order_id, reservation_id, picked_up_by, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [orderId, reservationId, 'Test Collector', 'Picked up on time']
  );
  const pickupId = pickupResult.rows[0].id;
  
  console.log('✅ Test data created');
  console.log(`   Vendor ID: ${vendorId}`);
  console.log(`   Order ID: ${orderId}`);
  console.log(`   Reservation ID: ${reservationId}`);
  console.log(`   Pickup ID: ${pickupId}`);
  console.log(`   Order Status: PICKED_UP\n`);
  
  return { vendorId, orderId, reservationId, pickupId };
}

async function testReturnWorkflow() {
  console.log('🧪 Testing Return Workflow\n');
  
  try {
    const { vendorId, orderId, reservationId, pickupId } = await setupTestData();
    
    console.log('--- Test 1: Late Fee Calculation ---');
    const onTimeInfo = returnService.calculateLateFee(
      '2026-01-31T10:00:00Z',
      '2026-01-31T09:00:00Z',
      1000
    );
    console.log('On-time return:', onTimeInfo);
    console.assert(onTimeInfo.isLate === false, 'Should not be late');
    console.assert(onTimeInfo.lateFee === 0, 'Late fee should be 0');
    
    const lateInfo = returnService.calculateLateFee(
      '2026-01-31T10:00:00Z',
      '2026-02-02T10:00:00Z',
      1000
    );
    console.log('Late return (2 days):', lateInfo);
    console.assert(lateInfo.isLate === true, 'Should be late');
    console.assert(lateInfo.daysLate === 2, 'Should be 2 days late');
    console.assert(lateInfo.lateFee === 400, '1000 × 0.20 × 2 = 400');
    console.log('✅ Late fee calculation passed\n');
    
    console.log('--- Test 2: Get Pending Returns ---');
    const pendingReturns = await returnService.getPendingReturns(vendorId);
    console.log(`Found ${pendingReturns.length} pending return(s)`);
    console.assert(pendingReturns.length === 1, 'Should have 1 pending return');
    console.log('✅ Pending returns query passed\n');
    
    console.log('--- Test 3: Record On-Time Return ---');
    const returnResult = await returnService.recordReturn(vendorId, 'VENDOR', {
      orderId,
      reservationId,
      pickupId,
      conditionNotes: 'Equipment returned in excellent condition'
    });
    
    console.log('Return recorded:');
    console.log(`  Is Late: ${returnResult.lateInfo.isLate}`);
    console.log(`  Late Fee: ₹${returnResult.lateInfo.lateFee}`);
    console.log(`  Order Status: ${returnResult.order.status}`);
    console.assert(returnResult.order.status === 'RETURNED', 'Order status should be RETURNED');
    console.log('✅ Return recording passed\n');
    
    console.log('--- Test 4: Verify Reservation Completed ---');
    const resCheck = await pool.query(
      'SELECT status FROM reservations WHERE id = $1',
      [reservationId]
    );
    console.assert(resCheck.rows[0].status === 'COMPLETED', 'Reservation should be COMPLETED');
    console.log('✅ Reservation completion verified\n');
    
    console.log('--- Test 5: Pending Returns After Recording ---');
    const pendingAfter = await returnService.getPendingReturns(vendorId);
    console.log(`Pending returns now: ${pendingAfter.length}`);
    console.assert(pendingAfter.length === 0, 'Should have 0 pending returns');
    console.log('✅ Pending returns correctly updated\n');
    
    console.log('--- Test 6: Return History ---');
    const history = await returnService.getReturnHistory(vendorId);
    console.log(`History count: ${history.returns.length}`);
    console.assert(history.returns.length > 0, 'Should have return history');
    console.log('✅ Return history query passed\n');
    
    console.log('--- Test 7: Cannot Return Already Returned Order ---');
    try {
      await returnService.recordReturn(vendorId, 'VENDOR', {
        orderId,
        reservationId,
        pickupId,
        conditionNotes: 'Duplicate'
      });
      console.log('❌ Should have thrown error');
    } catch (error) {
      console.assert(
        error.message.includes('already been returned') || error.message.includes('RETURNED'),
        'Should reject already returned order'
      );
      console.log('✅ Duplicate return prevention passed\n');
    }
    
    console.log('🎉 All return workflow tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@return.com']);
  }
}

testReturnWorkflow()
  .then(() => {
    console.log('\n✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
