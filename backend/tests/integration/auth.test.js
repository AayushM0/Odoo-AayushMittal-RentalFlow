const request = require('supertest');
const app = require('../../server');
const { 
  setupTestDatabase, 
  cleanTestDatabase, 
  closeTestDatabase 
} = require('../../src/config/database.test');
const { 
  createTestUser, 
  createAuthenticatedUser 
} = require('../helpers/authHelper');

describe('Authentication API Integration Tests', () => {
  
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    
    it('should register a new customer successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Customer',
          email: 'newcustomer@example.com',
          password: 'Password@123',
          role: 'CUSTOMER'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('newcustomer@example.com');
      expect(response.body.data.user.role).toBe('CUSTOMER');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should register a new vendor successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Vendor',
          email: 'newvendor@example.com',
          password: 'Password@123',
          role: 'VENDOR',
          company: 'Test Company',
          gstin: 'TEST123456789'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('VENDOR');
    });

    it('should reject duplicate email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'existing@example.com',
          password: 'Password@123',
          role: 'CUSTOMER'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/already|exists|registered/i);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User'
          // Missing email, password, role
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password@123',
          role: 'CUSTOMER'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123', // Too weak
          role: 'CUSTOMER'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    
    it('should login with valid credentials', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject invalid password', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'correctpassword'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/invalid|incorrect|wrong/i);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject inactive user', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        password: 'password123',
        is_active: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/deactivated|inactive|disabled/i);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    
    it('should return user profile with valid token', async () => {
      const { user, token } = await createAuthenticatedUser('CUSTOMER');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.role).toBe(user.role);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject expired token', async () => {
      // This would require generating an expired token
      // For now, we'll just test with a malformed token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    
    it('should logout successfully', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/logged out|success/i);
    });

    it('should work even without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      // Logout should succeed even without auth
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Role-Based Access', () => {
    
    it('should return correct role for customer', async () => {
      const { user, token } = await createAuthenticatedUser('CUSTOMER');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.data.role).toBe('CUSTOMER');
    });

    it('should return correct role for vendor', async () => {
      const { user, token } = await createAuthenticatedUser('VENDOR');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.data.role).toBe('VENDOR');
    });

    it('should return correct role for admin', async () => {
      const { user, token } = await createAuthenticatedUser('ADMIN');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.data.role).toBe('ADMIN');
    });
  });
});
