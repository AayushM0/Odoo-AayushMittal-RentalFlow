const express = require('express');
const router = express.Router();
const pickupController = require('../controllers/pickup.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post(
  '/',
  authenticate,
  pickupController.recordPickup
);

router.get(
  '/pending',
  authenticate,
  pickupController.getPendingPickups
);

router.get(
  '/history',
  authenticate,
  pickupController.getPickupHistory
);

router.get(
  '/:id',
  authenticate,
  pickupController.getPickupById
);

module.exports = router;
