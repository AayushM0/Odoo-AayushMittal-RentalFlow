const express = require('express');
const quotationController = require('../controllers/quotation.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Customer creates quotation
router.post(
  '/',
  authorize('CUSTOMER'),
  quotationController.createQuotation
);

// Get user's quotations (customer or vendor)
router.get('/', quotationController.getQuotations);

// Get quotation by ID
router.get('/:id', quotationController.getQuotationById);

// Vendor approves quotation
router.post(
  '/:id/approve',
  authorize('VENDOR'),
  quotationController.approveQuotation
);

// Vendor rejects quotation
router.post(
  '/:id/reject',
  authorize('VENDOR'),
  quotationController.rejectQuotation
);

// Customer converts to order
router.post(
  '/:id/convert',
  authorize('CUSTOMER'),
  quotationController.convertToOrder
);

module.exports = router;
