const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');
const { ApiError } = require('../utils/errors');
const { auth: authSchemas } = require('../database/schemas');

const { registerSchema, loginSchema } = authSchemas;

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw new ApiError(error.details[0].message, 400);

    const result = await authService.registerUser(value);
    
    if (!result.success) {
      throw new ApiError(result.error, 400);
    }

    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.data.user,
        accessToken: result.data.accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new ApiError(error.details[0].message, 400);

    const result = await authService.loginUser(value.email, value.password);

    if (!result.success) {
      const statusCode = result.error === 'Account deactivated' ? 403 : 401;
      throw new ApiError(result.error, statusCode);
    }

    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.data.user,
        accessToken: result.data.accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      throw new ApiError('Refresh token missing', 401);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    const accessToken = authService.generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    });

    res.status(200).json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new ApiError('Invalid refresh token', 403));
    } else {
      next(error);
    }
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

const me = async (req, res, next) => {
  try {
    const pool = require('../config/database');
    
    const result = await pool.query(
      'SELECT id, email, role, name, phone, company, category, gstin, profile_image, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError('User not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, me };
