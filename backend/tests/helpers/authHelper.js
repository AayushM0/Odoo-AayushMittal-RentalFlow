const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../../src/config/database.test');

/**
 * Create a test user in the database
 * @param {Object} userData - User data overrides
 * @returns {Promise<Object>} Created user with plain password
 */
async function createTestUser(userData = {}) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  
  const defaultUser = {
    name: userData.name || 'Test User',
    email: userData.email || `test${timestamp}${randomSuffix}@example.com`,
    password: userData.password || 'password123',
    role: userData.role || 'CUSTOMER',
    is_active: userData.is_active !== undefined ? userData.is_active : true,
    phone: userData.phone || null,
    company: userData.company || null,
    category: userData.category || null,
    gstin: userData.gstin || null
  };
  
  // Hash password
  const hashedPassword = await bcrypt.hash(defaultUser.password, 10);
  
  const result = await query(
    `INSERT INTO users (name, email, password, role, is_active, phone, company, category, gstin) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING id, name, email, role, is_active, created_at`,
    [
      defaultUser.name,
      defaultUser.email,
      hashedPassword,
      defaultUser.role,
      defaultUser.is_active,
      defaultUser.phone,
      defaultUser.company,
      defaultUser.category,
      defaultUser.gstin
    ]
  );
  
  return {
    ...result.rows[0],
    password: defaultUser.password // Return plain password for testing
  };
}

/**
 * Generate JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'test-secret-key-12345',
    { expiresIn: '1h' }
  );
}

/**
 * Create a user with authentication token
 * @param {string} role - User role (CUSTOMER, VENDOR, ADMIN)
 * @param {Object} userData - Additional user data
 * @returns {Promise<Object>} User and token
 */
async function createAuthenticatedUser(role = 'CUSTOMER', userData = {}) {
  const user = await createTestUser({ role, ...userData });
  const token = generateToken(user);
  
  return { user, token };
}

/**
 * Create multiple test users
 * @param {number} count - Number of users to create
 * @param {string} role - Role for all users
 * @returns {Promise<Array>} Array of created users
 */
async function createMultipleUsers(count, role = 'CUSTOMER') {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({ 
      role,
      name: `Test User ${i + 1}`
    });
    users.push(user);
  }
  return users;
}

/**
 * Create a complete set of users for testing (customer, vendor, admin)
 * @returns {Promise<Object>} Object with customer, vendor, admin users and tokens
 */
async function createTestUserSet() {
  const customer = await createAuthenticatedUser('CUSTOMER', { name: 'Test Customer' });
  const vendor = await createAuthenticatedUser('VENDOR', { name: 'Test Vendor' });
  const admin = await createAuthenticatedUser('ADMIN', { name: 'Test Admin' });
  
  return {
    customer,
    vendor,
    admin
  };
}

module.exports = {
  createTestUser,
  generateToken,
  createAuthenticatedUser,
  createMultipleUsers,
  createTestUserSet
};
