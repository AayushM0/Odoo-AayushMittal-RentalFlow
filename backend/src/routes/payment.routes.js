const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post(
  '/create-order',
  authenticate,
  paymentController.createPaymentOrder
);

router.post(
  '/verify',
  authenticate,
  paymentController.verifyPayment
);

router.post(
  '/webhook',
  paymentController.handleWebhook
);

router.post(
  '/refund',
  authenticate,
  paymentController.createRefund
);

router.get(
  '/status/:orderId',
  authenticate,
  paymentController.getPaymentStatus
);

module.exports = router;
