const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const searchController = require('../controllers/search.controller');

router.get('/products', searchController.searchProducts);
router.get('/products/suggestions', searchController.searchSuggestions);
router.get('/categories', searchController.getCategories);
router.get('/orders', authenticate, searchController.searchOrders);

module.exports = router;
