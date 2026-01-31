const { query } = require('../../src/config/database.test');

/**
 * Create a test product with variants
 * @param {number} vendorId - Vendor user ID
 * @param {Object} productData - Product data overrides
 * @returns {Promise<Object>} Created product with variants
 */
async function createTestProduct(vendorId, productData = {}) {
  const timestamp = Date.now();
  
  const defaultProduct = {
    name: productData.name || `Test Product ${timestamp}`,
    description: productData.description || 'Test product description for integration testing',
    category: productData.category || 'Test Category',
    main_image: productData.main_image || null,
    additional_images: productData.additional_images || null
  };
  
  // Create product
  const productResult = await query(
    `INSERT INTO products (vendor_id, name, description, category, main_image, additional_images) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, vendor_id, name, description, category, created_at`,
    [
      vendorId,
      defaultProduct.name,
      defaultProduct.description,
      defaultProduct.category,
      defaultProduct.main_image,
      defaultProduct.additional_images
    ]
  );
  
  const product = productResult.rows[0];
  
  // Create default variant
  const variantData = {
    sku: productData.sku || `SKU-${timestamp}`,
    attributes: productData.attributes || { size: 'default', color: 'default' },
    price_hourly: productData.price_hourly || 50,
    price_daily: productData.price_daily || productData.price || 100,
    price_weekly: productData.price_weekly || 600,
    price_monthly: productData.price_monthly || 2000,
    stock_quantity: productData.stock_quantity || productData.stock || 10
  };
  
  const variantResult = await query(
    `INSERT INTO variants 
     (product_id, sku, attributes, price_hourly, price_daily, price_weekly, price_monthly, stock_quantity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, product_id, sku, price_daily, stock_quantity`,
    [
      product.id,
      variantData.sku,
      JSON.stringify(variantData.attributes),
      variantData.price_hourly,
      variantData.price_daily,
      variantData.price_weekly,
      variantData.price_monthly,
      variantData.stock_quantity
    ]
  );
  
  return {
    ...product,
    variant: variantResult.rows[0],
    variants: [variantResult.rows[0]]
  };
}

/**
 * Create multiple test products
 * @param {number} vendorId - Vendor user ID
 * @param {number} count - Number of products to create
 * @param {string} category - Category for all products
 * @returns {Promise<Array>} Array of created products
 */
async function createMultipleProducts(vendorId, count, category = 'Test Category') {
  const products = [];
  for (let i = 0; i < count; i++) {
    const product = await createTestProduct(vendorId, {
      name: `Test Product ${i + 1}`,
      category,
      price: 100 + (i * 50),
      stock: 10 + (i * 5)
    });
    products.push(product);
  }
  return products;
}

/**
 * Create a product with specific stock quantity
 * @param {number} vendorId - Vendor user ID
 * @param {number} stock - Stock quantity
 * @returns {Promise<Object>} Created product
 */
async function createProductWithStock(vendorId, stock) {
  return createTestProduct(vendorId, {
    name: `Product with ${stock} units`,
    stock_quantity: stock
  });
}

/**
 * Update product stock
 * @param {number} productId - Product ID
 * @param {number} variantId - Variant ID
 * @param {number} quantity - New stock quantity
 */
async function updateProductStock(productId, variantId, quantity) {
  await query(
    `UPDATE variants SET stock_quantity = $1 WHERE id = $2 AND product_id = $3`,
    [quantity, variantId, productId]
  );
}

/**
 * Get product with variants
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Product with variants
 */
async function getProductWithVariants(productId) {
  const productResult = await query(
    `SELECT * FROM products WHERE id = $1`,
    [productId]
  );
  
  if (productResult.rows.length === 0) {
    return null;
  }
  
  const variantsResult = await query(
    `SELECT * FROM variants WHERE product_id = $1`,
    [productId]
  );
  
  return {
    ...productResult.rows[0],
    variants: variantsResult.rows
  };
}

module.exports = {
  createTestProduct,
  createMultipleProducts,
  createProductWithStock,
  updateProductStock,
  getProductWithVariants
};
