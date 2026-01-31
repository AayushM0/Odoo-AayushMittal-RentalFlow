const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getDashboardData } = require('../controllers/vendor.controller');

router.get('/dashboard', authenticate, authorize('VENDOR'), getDashboardData);

module.exports = router;
