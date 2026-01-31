const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const customerController = require('../controllers/customer.controller');

router.get('/dashboard', 
  authenticate, 
  authorize('CUSTOMER'), 
  customerController.getDashboardData
);

module.exports = router;
