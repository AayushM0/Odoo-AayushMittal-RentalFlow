const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

router.get('/dashboard', 
  authenticate, 
  authorize('ADMIN'), 
  adminController.getDashboardData
);

router.get('/analytics', 
  authenticate, 
  authorize('ADMIN'), 
  adminController.getAnalyticsData
);

router.get('/reports', 
  authenticate, 
  authorize('ADMIN'), 
  adminController.generateReport
);

module.exports = router;
