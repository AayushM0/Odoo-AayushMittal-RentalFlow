const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const SALT_ROUNDS = 12;

// Hash password
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

// Verify password
const comparePassword = async (plainPassword, hash) => {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate access token
const generateAccessToken = (user) => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
    });
  } catch (error) {
    throw new Error('Access token generation failed');
  }
};

// Generate refresh token
const generateRefreshToken = (user) => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
    });
  } catch (error) {
    throw new Error('Refresh token generation failed');
  }
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token verification failed');
  }
};

// Register user
const registerUser = async (userData) => {
  const { email, password, role, name, company, category, gstin, phone } = userData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check email exists
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (emailCheck.rows.length > 0) {
      throw new Error('Email already registered');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Insert user
    const result = await client.query(
      `INSERT INTO users 
       (email, password_hash, role, name, company, category, gstin, phone) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, email, role, name, company, category, gstin, phone, created_at`,
      [email, passwordHash, role, name, company, category, gstin, phone]
    );
    
    await client.query('COMMIT');
    
    const user = result.rows[0];
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
      success: true,
      data: {
        user,
        accessToken,
        refreshToken
      }
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
    
    const user = result.rows[0];
    
    // Check active
    if (!user.is_active) {
      return {
        success: false,
        error: 'Account deactivated'
      };
    }
    
    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
    
    // Remove password
    delete user.password_hash;
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
      success: true,
      data: {
        user,
        accessToken,
        refreshToken
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  registerUser,
  loginUser
};
