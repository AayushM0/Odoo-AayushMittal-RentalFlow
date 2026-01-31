const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const settingsController = require('../controllers/settings.controller');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Public routes (no authentication required)
router.get('/public', settingsController.getPublicSettings);

// Admin-only routes (authentication + admin role required)
router.get('/', authenticate, requireAdmin, settingsController.getAllSettings);
router.get('/categories', authenticate, requireAdmin, settingsController.getCategories);
router.get('/category/:category', authenticate, requireAdmin, settingsController.getSettingsByCategory);
router.put('/', authenticate, requireAdmin, settingsController.updateSettings);
router.put('/:key', authenticate, requireAdmin, settingsController.updateSetting);
router.post('/', authenticate, requireAdmin, settingsController.createSetting);
router.delete('/:key', authenticate, requireAdmin, settingsController.deleteSetting);
router.post('/reload', authenticate, requireAdmin, settingsController.reloadSettings);

module.exports = router;
