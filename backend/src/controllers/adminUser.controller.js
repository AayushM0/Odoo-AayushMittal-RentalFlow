const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const {
      q = '',
      role,
      status = 'all',
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    let query = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (q) {
      const searchTerm = `%${q}%`;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount+1} OR phone ILIKE $${paramCount+2})`;
      params.push(searchTerm, searchTerm, searchTerm);
      paramCount += 3;
    }

    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (status === 'active') {
      query += ` AND is_active = TRUE`;
    } else if (status === 'inactive') {
      query += ` AND is_active = FALSE`;
    }

    const sortOptions = {
      newest: 'created_at DESC',
      oldest: 'created_at ASC',
      name_asc: 'name ASC',
      name_desc: 'name DESC'
    };
    query += ` ORDER BY ${sortOptions[sort] || sortOptions.newest}`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount+1}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);
    const users = result.rows;

    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const countParams = [];
    let countParamNum = 1;
    
    if (q) {
      const searchTerm = `%${q}%`;
      countQuery += ` AND (name ILIKE $${countParamNum} OR email ILIKE $${countParamNum+1} OR phone ILIKE $${countParamNum+2})`;
      countParams.push(searchTerm, searchTerm, searchTerm);
      countParamNum += 3;
    }
    if (role) {
      countQuery += ` AND role = $${countParamNum}`;
      countParams.push(role);
      countParamNum++;
    }
    if (status === 'active') {
      countQuery += ` AND is_active = TRUE`;
    } else if (status === 'inactive') {
      countQuery += ` AND is_active = FALSE`;
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, name, email, phone, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
      [name, email, phone || null, hashedPassword, role]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.rows[0].id
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    const users = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (users.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (email) {
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (email) {
      updates.push(`email = $${paramCount}`);
      params.push(email);
      paramCount++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }
    if (role) {
      updates.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await db.query(
      'SELECT is_active FROM users WHERE id = $1',
      [id]
    );

    if (users.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newStatus = !users.rows[0].is_active;

    await db.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      is_active: newStatus
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (users.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await db.query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'CUSTOMER' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN role = 'VENDOR' THEN 1 ELSE 0 END) as vendors,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_users
      FROM users
    `);

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};
