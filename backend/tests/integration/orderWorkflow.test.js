const request = require('supertest');
const app = require('../../server');
const {
  setupTestDatabase,
  cleanTestDatabase,
  closeTestDatabase
} = require('../../src/config/database.test');
const { 
  createAuthenticatedUser, 
  createTestUserSet 
} = require('../helpers/authHelper');
const { createTestProduct } = require('../helpers/productFactory');
const { 
  createOrderWithItems, 
  getOrderWithItems 
} = require('../helpers/orderFactory');

describe('Order Workflow Integration Tests', () => {
  
  let customer, vendor, product, customerToken, vendorToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    // Create customer
    const customerAuth = await createAuthenticatedUser('CUSTOMER');
    customer = customerAuth.user;
    customerToken = customerAuth.token;

    // Create vendor
    const vendorAuth = await createAuthenticatedUser('VENDOR');
    vendor = vendorAuth.user;
    vendorToken = vendorAuth.token;

    // Create product
    product = await createTestProduct(vendor.id, {
      name: 'Test Product for Order',
      price_daily: 100,
      stock_quantity: 10
    });
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('Complete Order Flow', () => {
    
    it('should complete full order workflow from creation to confirmation', async () => {
      // Step 1: Create Order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 2,
              price_per_day: 100
            }
          ]
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const orderId = createResponse.body.orderId || createResponse.body.order?.id;
      expect(orderId).toBeDefined();

      // Step 2: Retrieve Order as Customer
      const getResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.order || getResponse.body.data).toBeDefined();
      const order = getResponse.body.order || getResponse.body.data;
      expect(order.status).toBe('PENDING');
      expect(order.customer_id).toBe(customer.id);

      // Step 3: Vendor Confirms Order
      const confirmResponse = await request(app)
        .put(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.success).toBe(true);

      // Step 4: Verify Updated Status
      const updatedOrderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(updatedOrderResponse.status).toBe(200);
      const updatedOrder = updatedOrderResponse.body.order || updatedOrderResponse.body.data;
      expect(updatedOrder.status).toBe('CONFIRMED');
    });

    it('should calculate total amount correctly', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 2,
              price_per_day: 100
            }
          ]
        });

      expect(response.status).toBe(201);
      const orderId = response.body.orderId || response.body.order?.id;

      const orderDetails = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      const order = orderDetails.body.order || orderDetails.body.data;
      // 2 items × ₹100/day × 4 days = ₹800
      expect(parseFloat(order.total_amount)).toBe(800);
    });

    it('should handle order cancellation', async () => {
      // Create order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 1,
              price_per_day: 100
            }
          ]
        });

      const orderId = createResponse.body.orderId || createResponse.body.order?.id;

      // Cancel order
      const cancelResponse = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.success).toBe(true);

      // Verify status
      const orderDetails = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      const order = orderDetails.body.order || orderDetails.body.data;
      expect(order.status).toBe('CANCELLED');
    });
  });

  describe('Stock Management', () => {
    
    it('should prevent ordering more than available stock', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 20, // More than stock (10)
              price_per_day: 100
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toMatch(/stock|available|insufficient/i);
    });

    it('should prevent double booking for overlapping dates', async () => {
      // Create first order
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 10, // Book all stock
              price_per_day: 100
            }
          ]
        });

      // Try to create overlapping order
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-03',
          rental_end_date: '2024-02-07',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 5,
              price_per_day: 100
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toMatch(/available|stock|reserved/i);
    });

    it('should allow booking for non-overlapping dates', async () => {
      // Create first order
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 5,
              price_per_day: 100
            }
          ]
        });

      // Create non-overlapping order
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-10',
          rental_end_date: '2024-02-15',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 5,
              price_per_day: 100
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Multi-Item Orders', () => {
    
    it('should create order with multiple items', async () => {
      const product2 = await createTestProduct(vendor.id, {
        name: 'Second Product',
        price_daily: 150,
        stock_quantity: 5
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 2,
              price_per_day: 100
            },
            {
              product_id: product2.id,
              variant_id: product2.variant.id,
              quantity: 1,
              price_per_day: 150
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const orderId = response.body.orderId || response.body.order?.id;
      const orderDetails = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      const order = orderDetails.body.order || orderDetails.body.data;
      // (2 × 100 + 1 × 150) × 4 days = 350 × 4 = 1400
      expect(parseFloat(order.total_amount)).toBe(1400);
    });
  });

  describe('Access Control', () => {
    
    it('should not allow customer to view other customer\'s orders', async () => {
      // Create order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 1,
              price_per_day: 100
            }
          ]
        });

      const orderId = createResponse.body.orderId || createResponse.body.order?.id;

      // Try to access with different customer
      const { token: otherCustomerToken } = await createAuthenticatedUser('CUSTOMER');
      
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow vendor to view their orders', async () => {
      // Create order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 1,
              price_per_day: 100
            }
          ]
        });

      const orderId = createResponse.body.orderId || createResponse.body.order?.id;

      // Vendor should be able to view
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
    });

    it('should not allow vendor to confirm other vendor\'s orders', async () => {
      // Create order for vendor1
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 1,
              price_per_day: 100
            }
          ]
        });

      const orderId = createResponse.body.orderId || createResponse.body.order?.id;

      // Try to confirm with different vendor
      const { token: otherVendorToken } = await createAuthenticatedUser('VENDOR');
      
      const response = await request(app)
        .put(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${otherVendorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Order Validation', () => {
    
    it('should reject order without items', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject order with invalid dates', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-10',
          rental_end_date: '2024-02-05', // End before start
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 1,
              price_per_day: 100
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for order creation', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          vendor_id: vendor.id,
          rental_start_date: '2024-02-01',
          rental_end_date: '2024-02-05',
          delivery_address: '123 Test Street',
          items: [
            {
              product_id: product.id,
              variant_id: product.variant.id,
              quantity: 1,
              price_per_day: 100
            }
          ]
        });

      expect(response.status).toBe(401);
    });
  });
});
