const express = require('express');
const router = express.Router();
const returnController = require('../controllers/return.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { recordReturnSchema, calculateLateFeeSchema } = require('../database/schemas');

router.post(
  '/',
  authenticate,
  validate(recordReturnSchema),
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
  validate(calculateLateFeeSchema),
  returnController.calculateLateFee
);

module.exports = router;
