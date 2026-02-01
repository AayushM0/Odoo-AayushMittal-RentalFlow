const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post(
  '/',
  authorize('CUSTOMER', 'VENDOR'),
  orderController.createOrder
);

router.get('/', orderController.getOrders);

router.get('/:id', orderController.getOrderById);

router.post('/:id/confirm', orderController.confirmOrder);

router.post('/:id/mark-payment-complete', authorize('CUSTOMER', 'VENDOR'), orderController.markPaymentComplete);

router.delete('/:id', orderController.cancelOrder);

module.exports = router;
