const db = require('../config/database');
const Product = require('../models/Product');
const { ApiError } = require('../utils/errors');

class ProductService {
  static async createProduct(vendorId, productData, variantsData) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const product = await Product.create(client, {
        ...productData,
        vendor_id: vendorId
      });

      const variants = [];
      if (variantsData && variantsData.length > 0) {
        for (const variantData of variantsData) {
          const variant = await Product.createVariant(client, product.id, variantData);
          variants.push(variant);
        }
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          ...product,
          variants
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new ApiError(error.message || 'Product creation failed', 500);
    } finally {
      client.release();
    }
  }

  static async getProducts(filters, userId = null, userRole = null) {
    try {
      const queryFilters = { ...filters };

      if (userRole === 'CUSTOMER' || !userRole) {
        queryFilters.is_published = true;
      }

      if (userRole === 'VENDOR' && userId) {
        queryFilters.vendor_id = userId;
      }

      const result = await Product.findAll(queryFilters);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new ApiError(error.message || 'Failed to fetch products', 500);
    }
  }

  static async getProductById(id, userId = null, userRole = null) {
    try {
      const product = await Product.findById(id);

      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      if (!product.is_published && userRole === 'VENDOR' && product.vendor_id !== userId) {
        throw new ApiError('Product not found', 404);
      }

      if (!product.is_published && userRole === 'CUSTOMER') {
        throw new ApiError('Product not found', 404);
      }

      return {
        success: true,
        data: product
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Failed to fetch product', 500);
    }
  }

  static async updateProduct(id, vendorId, userRole, updates) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const product = await Product.findById(id);

      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      if (userRole !== 'ADMIN' && product.vendor_id !== vendorId) {
        throw new ApiError('Not authorized to update this product', 403);
      }

      const { variants, ...productUpdates } = updates;

      const updated = await Product.update(client, id, productUpdates);

      let updatedVariants = [];
      if (variants && variants.length > 0) {
        for (const variantData of variants) {
          if (variantData.id) {
            const updatedVariant = await Product.updateVariant(client, variantData.id, variantData);
            updatedVariants.push(updatedVariant);
          } else {
            const newVariant = await Product.createVariant(client, id, variantData);
            updatedVariants.push(newVariant);
          }
        }
      }

      await client.query('COMMIT');

      const finalProduct = await Product.findById(id);

      return {
        success: true,
        data: finalProduct
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Update failed', 500);
    } finally {
      client.release();
    }
  }

  static async deleteProduct(id, vendorId, userRole) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const product = await Product.findById(id);

      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      if (userRole !== 'ADMIN' && product.vendor_id !== vendorId) {
        throw new ApiError('Not authorized to delete this product', 403);
      }

      await Product.delete(client, id);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Delete failed', 500);
    } finally {
      client.release();
    }
  }

  static async createVariant(productId, vendorId, userRole, variantData) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const product = await Product.findById(productId);

      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      if (userRole !== 'ADMIN' && product.vendor_id !== vendorId) {
        throw new ApiError('Not authorized to modify this product', 403);
      }

      const variant = await Product.createVariant(client, productId, variantData);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Variant created successfully',
        data: variant
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Variant creation failed', 500);
    } finally {
      client.release();
    }
  }

  static async updateVariant(productId, variantId, vendorId, userRole, updates) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const product = await Product.findById(productId);

      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      if (userRole !== 'ADMIN' && product.vendor_id !== vendorId) {
        throw new ApiError('Not authorized to modify this product', 403);
      }

      const variant = await Product.findVariantById(variantId);
      if (!variant || variant.product_id !== parseInt(productId)) {
        throw new ApiError('Variant not found', 404);
      }

      const updated = await Product.updateVariant(client, variantId, updates);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Variant updated successfully',
        data: updated
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Variant update failed', 500);
    } finally {
      client.release();
    }
  }

  static async deleteVariant(productId, variantId, vendorId, userRole) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const product = await Product.findById(productId);

      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      if (userRole !== 'ADMIN' && product.vendor_id !== vendorId) {
        throw new ApiError('Not authorized to modify this product', 403);
      }

      const variant = await Product.findVariantById(variantId);
      if (!variant || variant.product_id !== parseInt(productId)) {
        throw new ApiError('Variant not found', 404);
      }

      await Product.deleteVariant(client, variantId);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Variant deleted successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Variant deletion failed', 500);
    } finally {
      client.release();
    }
  }
}

module.exports = ProductService;
