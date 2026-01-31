const db = require('../config/database');
const Product = require('../models/Product');
const { ApiError } = require('../utils/errors');

class ProductService {
  static async createProduct(vendorId, productData, variantsData) {
    if (!variantsData || variantsData.length === 0) {
      throw new ApiError('Product must have at least one variant', 400);
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const product = await Product.create(client, {
        ...productData,
        vendor_id: vendorId
      });

      const variants = [];
      for (const variantData of variantsData) {
        const variant = await Product.createVariant(client, product.id, variantData);
        variants.push(variant);
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

      const updated = await Product.update(client, id, updates);

      await client.query('COMMIT');

      return {
        success: true,
        data: updated
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
}

module.exports = ProductService;
