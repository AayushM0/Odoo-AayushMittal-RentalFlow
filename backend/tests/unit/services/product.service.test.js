const productService = require('../../../src/services/product.service');
const db = require('../../../src/config/database');
const { validProduct, productWithVariants } = require('../../fixtures/products');

jest.mock('../../../src/config/database');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [validProduct];
      const mockCount = { rows: [{ total: '1' }] };

      db.query
        .mockResolvedValueOnce({ rows: mockProducts })
        .mockResolvedValueOnce(mockCount);

      const result = await productService.getProducts({
        page: 1,
        limit: 20
      });

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should filter by category', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await productService.getProducts({
        category: 'Electronics',
        page: 1,
        limit: 20
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('category'),
        expect.any(Array)
      );
    });

    it('should search by query', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await productService.getProducts({
        q: 'test',
        page: 1,
        limit: 20
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.any(Array)
      );
    });
  });

  describe('getProductById', () => {
    it('should return product with variants', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [productWithVariants] })
        .mockResolvedValueOnce({ rows: productWithVariants.variants });

      const result = await productService.getProductById(2);

      expect(result.id).toBe(2);
      expect(result.variants).toHaveLength(2);
    });

    it('should return null for non-existent product', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await productService.getProductById(999);

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const productData = {
        name: 'New Product',
        description: 'Description',
        category: 'Electronics',
        vendor_id: 3
      };

      const result = await productService.createProduct(productData);

      expect(result.id).toBe(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        expect.any(Array)
      );
    });

    it('should handle database errors', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      await expect(
        productService.createProduct({ name: 'Test' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      db.query.mockResolvedValue({ rowCount: 1 });

      const updates = { name: 'Updated Name', description: 'Updated' };
      const result = await productService.updateProduct(1, updates);

      expect(result.success).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products'),
        expect.any(Array)
      );
    });

    it('should return false for non-existent product', async () => {
      db.query.mockResolvedValue({ rowCount: 0 });

      const result = await productService.updateProduct(999, { name: 'Test' });

      expect(result.success).toBe(false);
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product', async () => {
      db.query.mockResolvedValue({ rowCount: 1 });

      const result = await productService.deleteProduct(1);

      expect(result.success).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('is_active = FALSE'),
        [1]
      );
    });
  });

  describe('checkAvailability', () => {
    it('should check product availability', async () => {
      db.query.mockResolvedValue({ rows: [{ available_stock: 10 }] });

      const isAvailable = await productService.checkAvailability(1, {
        startDate: new Date(),
        endDate: new Date(),
        quantity: 5
      });

      expect(isAvailable).toBe(true);
    });

    it('should return false when stock insufficient', async () => {
      db.query.mockResolvedValue({ rows: [{ available_stock: 2 }] });

      const isAvailable = await productService.checkAvailability(1, {
        startDate: new Date(),
        endDate: new Date(),
        quantity: 5
      });

      expect(isAvailable).toBe(false);
    });
  });
});
