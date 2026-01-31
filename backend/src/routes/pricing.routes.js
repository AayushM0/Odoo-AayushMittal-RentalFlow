const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricing.controller');

// Calculate rental price for a variant (public - no auth required)
router.post('/calculate', pricingController.calculateRentalPrice);

// Calculate duration between dates (public - no auth required)
router.get('/duration', pricingController.calculateDuration);

module.exports = router;
