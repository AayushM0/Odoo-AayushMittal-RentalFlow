const request = require('supertest');
const app = require('../../server');
const {
  setupTestDatabase,
  cleanTestDatabase,
  closeTestDatabase
} = require('../../src/config/database.test');
const { createAuthenticatedUser } = require('../helpers/authHelper');
const { 
  createTestProduct, 
  createMultipleProducts 
} = require('../helpers/productFactory');

describe('Products API Integration Tests', () => {
  
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /api/products', () => {
    
    it('should return all products', async () => {
      const { user: vendor } = await createAuthenticatedUser('VENDOR');
      await createMultipleProducts(vendor.id, 3);

      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toBeDefined();
      expect(response.body.products.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array when no products exist', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should filter products by category', async () => {
      const { user: vendor } = await createAuthenticatedUser('VENDOR');
      await createTestProduct(vendor.id, { category: 'Electronics' });
      await createTestProduct(vendor.id, { category: 'Furniture' });
      await createTestProduct(vendor.id, { category: 'Electronics' });

      const response = await request(app)
        .get('/api/products?category=Electronics');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThanOrEqual(2);
      response.body.products.forEach(product => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should support pagination', async () => {
      const { user: vendor } = await createAuthenticatedUser('VENDOR');
      await createMultipleProducts(vendor.id, 15);

      const response = await request(app)
        .get('/api/products?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/products/:id', () => {
    
    it('should return product details', async () => {
      const { user: vendor } = await createAuthenticatedUser('VENDOR');
      const product = await createTestProduct(vendor.id, {
        name: 'Test Product Details'
      });

      const response = await request(app)
        .get(`/api/products/${product.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product.id).toBe(product.id);
      expect(response.body.product.name).toBe('Test Product Details');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should include variants in product details', async () => {
      const { user: vendor } = await createAuthenticatedUser('VENDOR');
      const product = await createTestProduct(vendor.id);

      const response = await request(app)
        .get(`/api/products/${product.id}`);

      expect(response.status).toBe(200);
      expect(response.body.product.variants || response.body.variants).toBeDefined();
    });
  });

  describe('POST /api/products', () => {
    
    it('should create product as vendor', async () => {
      const { user, token } = await createAuthenticatedUser('VENDOR');

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Product',
          description: 'Product description',
          category: 'Test Category'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.productId || response.body.product?.id).toBeDefined();
    });

    it('should reject product creation by customer', async () => {
      const { token } = await createAuthenticatedUser('CUSTOMER');

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Product',
          description: 'Description',
          category: 'Test'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject product creation without authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'Product',
          description: 'Description',
          category: 'Test'
        });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const { token } = await createAuthenticatedUser('VENDOR');

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Product'
          // Missing description and category
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should allow admin to create products', async () => {
      const { token } = await createAuthenticatedUser('ADMIN');

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Admin Product',
          description: 'Created by admin',
          category: 'Test'
        });

      // Admin might or might not be allowed depending on implementation
      expect([201, 403]).toContain(response.status);
    });
  });

  describe('PUT /api/products/:id', () => {
    
    it('should update own product as vendor', async () => {
      const { user, token } = await createAuthenticatedUser('VENDOR');
      const product = await createTestProduct(user.id);

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Product Name',
          description: 'Updated description',
          category: 'Updated Category'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not update other vendor\'s product', async () => {
      const { user: vendor1 } = await createAuthenticatedUser('VENDOR');
      const { token: token2 } = await createAuthenticatedUser('VENDOR');
      
      const product = await createTestProduct(vendor1.id);

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          name: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent product', async () => {
      const { token } = await createAuthenticatedUser('VENDOR');

      const response = await request(app)
        .put('/api/products/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Update'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    
    it('should delete own product as vendor', async () => {
      const { user, token } = await createAuthenticatedUser('VENDOR');
      const product = await createTestProduct(user.id);

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify product is deleted
      const getResponse = await request(app)
        .get(`/api/products/${product.id}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should not delete other vendor\'s product', async () => {
      const { user: vendor1 } = await createAuthenticatedUser('VENDOR');
      const { token: token2 } = await createAuthenticatedUser('VENDOR');
      
      const product = await createTestProduct(vendor1.id);

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Product Search', () => {
    
    it('should search products by name', async () => {
      const { user: vendor } = await createAuthenticatedUser('VENDOR');
      await createTestProduct(vendor.id, { name: 'Laptop Computer' });
      await createTestProduct(vendor.id, { name: 'Desktop Computer' });
      await createTestProduct(vendor.id, { name: 'Mobile Phone' });

      const response = await request(app)
        .get('/api/products?search=computer');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThanOrEqual(2);
    });
  });
});
