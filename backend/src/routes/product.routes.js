const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes (no authentication required)
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Protected routes (VENDOR and ADMIN only)
router.post(
  '/',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  productController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  productController.deleteProduct
);

module.exports = router;
