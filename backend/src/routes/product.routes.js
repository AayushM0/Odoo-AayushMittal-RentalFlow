const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { optionalAuthenticate } = require('../middleware/optionalAuth.middleware');

const router = express.Router();

// Public routes (optional authentication for filtering)
router.get('/', optionalAuthenticate, productController.getProducts);
router.get('/:id', optionalAuthenticate, productController.getProductById);

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

// Variant management routes
router.post(
  '/:productId/variants',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  productController.createVariant
);

router.put(
  '/:productId/variants/:variantId',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  productController.updateVariant
);

router.delete(
  '/:productId/variants/:variantId',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  productController.deleteVariant
);

module.exports = router;
