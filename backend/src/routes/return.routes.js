const express = require('express');
const router = express.Router();
const returnController = require('../controllers/return.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post(
  '/',
  authenticate,
  returnController.recordReturn
);

router.get(
  '/pending',
  authenticate,
  returnController.getPendingReturns
);

router.get(
  '/history',
  authenticate,
  returnController.getReturnHistory
);

router.get(
  '/:id',
  authenticate,
  returnController.getReturnById
);

router.post(
  '/calculate-late-fee',
  authenticate,
  returnController.calculateLateFee
);

module.exports = router;
