const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post(
  '/generate',
  authenticate,
  invoiceController.generateInvoice
);

router.get(
  '/',
  authenticate,
  invoiceController.getInvoices
);

router.get(
  '/:id',
  authenticate,
  invoiceController.getInvoiceById
);

router.post(
  '/:id/generate-pdf',
  authenticate,
  invoiceController.generatePDF
);

router.get(
  '/:id/download',
  authenticate,
  invoiceController.downloadPDF
);

router.post(
  '/:id/send-email',
  authenticate,
  invoiceController.sendEmail
);

router.post(
  '/:id/payment',
  authenticate,
  invoiceController.recordPayment
);

router.get(
  '/export/csv',
  authenticate,
  invoiceController.exportCSV
);

router.get(
  '/export/json',
  authenticate,
  invoiceController.exportJSON
);

module.exports = router;
