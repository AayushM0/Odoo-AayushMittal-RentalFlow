const authController = require('../../../src/controllers/auth.controller');
const db = require('../../../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validCustomer, validAdmin, inactiveUser } = require('../../fixtures/users');

jest.mock('../../../src/config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'CUSTOMER'
      };

      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });
      
      bcrypt.hash.mockResolvedValue('hashedPassword123');

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('registered')
        })
      );
    });

    it('should return error for duplicate email', async () => {
      req.body = {
        name: 'Test',
        email: validCustomer.email,
        password: 'password123',
        role: 'CUSTOMER'
      };

      db.query.mockResolvedValue({ rows: [validCustomer] });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already')
        })
      );
    });

    it('should validate required fields', async () => {
      req.body = { name: 'Test' };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should handle database errors', async () => {
      req.body = {
        name: 'Test',
        email: 'test@test.com',
        password: 'password',
        role: 'CUSTOMER'
      };

      db.query.mockRejectedValue(new Error('Database error'));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      req.body = {
        email: validCustomer.email,
        password: 'password123'
      };

      const userWithPassword = { ...validCustomer, password_hash: 'hashedPassword' };
      db.query.mockResolvedValue({ rows: [userWithPassword] });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accessToken: 'mock-jwt-token'
          })
        })
      );
    });

    it('should reject invalid email', async () => {
      req.body = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      db.query.mockResolvedValue({ rows: [] });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid')
        })
      );
    });

    it('should reject invalid password', async () => {
      req.body = {
        email: validCustomer.email,
        password: 'wrongpassword'
      };

      const userWithPassword = { ...validCustomer, password_hash: 'hashedPassword' };
      db.query.mockResolvedValue({ rows: [userWithPassword] });
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject inactive user', async () => {
      req.body = {
        email: inactiveUser.email,
        password: 'password123'
      };

      const userWithPassword = { ...inactiveUser, password_hash: 'hashedPassword' };
      db.query.mockResolvedValue({ rows: [userWithPassword] });
      bcrypt.compare.mockResolvedValue(true);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('deactivated')
        })
      );
    });

    it('should validate required fields', async () => {
      req.body = { email: 'test@test.com' };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      req.user = { id: validCustomer.id };
      db.query.mockResolvedValue({ rows: [validCustomer] });

      await authController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            id: validCustomer.id,
            email: validCustomer.email
          })
        })
      );
    });

    it('should handle user not found', async () => {
      req.user = { id: 999 };
      db.query.mockResolvedValue({ rows: [] });

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
