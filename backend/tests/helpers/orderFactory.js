const { query } = require('../../src/config/database.test');

/**
 * Create a test order
 * @param {number} customerId - Customer user ID
 * @param {number} vendorId - Vendor user ID
 * @param {Object} orderData - Order data overrides
 * @returns {Promise<Object>} Created order
 */
async function createTestOrder(customerId, vendorId, orderData = {}) {
  const timestamp = Date.now();
  
  const defaultOrder = {
    order_number: orderData.order_number || `ORD-${timestamp}`,
    rental_start_date: orderData.rental_start_date || '2024-02-01',
    rental_end_date: orderData.rental_end_date || '2024-02-05',
    total_amount: orderData.total_amount || 1000,
    status: orderData.status || 'PENDING',
    delivery_address: orderData.delivery_address || '123 Test Street, Test City'
  };
  
  const result = await query(
    `INSERT INTO orders 
     (customer_id, vendor_id, order_number, rental_start_date, rental_end_date, 
      total_amount, status, delivery_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, customer_id, vendor_id, order_number, status, total_amount, created_at`,
    [
      customerId,
      vendorId,
      defaultOrder.order_number,
      defaultOrder.rental_start_date,
      defaultOrder.rental_end_date,
      defaultOrder.total_amount,
      defaultOrder.status,
      defaultOrder.delivery_address
    ]
  );
  
  return result.rows[0];
}

/**
 * Create order with items
 * @param {number} customerId - Customer user ID
 * @param {number} vendorId - Vendor user ID
 * @param {Array} items - Array of order items
 * @param {Object} orderData - Order data overrides
 * @returns {Promise<Object>} Created order with items
 */
async function createOrderWithItems(customerId, vendorId, items = [], orderData = {}) {
  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => {
    const days = calculateRentalDays(
      orderData.rental_start_date || '2024-02-01',
      orderData.rental_end_date || '2024-02-05'
    );
    return sum + (item.quantity * item.price_per_day * days);
  }, 0);
  
  // Create order
  const order = await createTestOrder(customerId, vendorId, {
    ...orderData,
    total_amount: totalAmount
  });
  
  // Create order items
  const orderItems = [];
  for (const item of items) {
    const itemResult = await query(
      `INSERT INTO order_items 
       (order_id, product_id, variant_id, quantity, price_per_day)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, order_id, product_id, variant_id, quantity, price_per_day`,
      [
        order.id,
        item.product_id,
        item.variant_id,
        item.quantity,
        item.price_per_day
      ]
    );
    orderItems.push(itemResult.rows[0]);
  }
  
  return {
    ...order,
    items: orderItems
  };
}

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 */
async function updateOrderStatus(orderId, status) {
  await query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, orderId]
  );
}

/**
 * Get order with items
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Order with items
 */
async function getOrderWithItems(orderId) {
  const orderResult = await query(
    `SELECT * FROM orders WHERE id = $1`,
    [orderId]
  );
  
  if (orderResult.rows.length === 0) {
    return null;
  }
  
  const itemsResult = await query(
    `SELECT oi.*, p.name as product_name 
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  
  return {
    ...orderResult.rows[0],
    items: itemsResult.rows
  };
}

/**
 * Calculate rental days between two dates
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {number} Number of days
 */
function calculateRentalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Create multiple orders for a customer
 * @param {number} customerId - Customer user ID
 * @param {number} vendorId - Vendor user ID
 * @param {number} count - Number of orders
 * @returns {Promise<Array>} Array of created orders
 */
async function createMultipleOrders(customerId, vendorId, count) {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const order = await createTestOrder(customerId, vendorId, {
      order_number: `ORD-TEST-${Date.now()}-${i}`,
      total_amount: 1000 + (i * 500)
    });
    orders.push(order);
  }
  return orders;
}

module.exports = {
  createTestOrder,
  createOrderWithItems,
  updateOrderStatus,
  getOrderWithItems,
  calculateRentalDays,
  createMultipleOrders
};
