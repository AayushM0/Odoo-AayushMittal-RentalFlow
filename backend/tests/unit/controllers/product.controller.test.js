const productController = require('../../../src/controllers/product.controller');
const db = require('../../../src/config/database');
const { validProduct, validVendor } = require('../../fixtures/products');
const { validVendor: vendor } = require('../../fixtures/users');

jest.mock('../../../src/config/database');

describe('ProductController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: vendor
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [validProduct];
      const mockCount = { rows: [{ total: '1' }] };

      db.query
        .mockResolvedValueOnce({ rows: mockProducts })
        .mockResolvedValueOnce(mockCount);

      await productController.getProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            products: mockProducts,
            pagination: expect.any(Object)
          })
        })
      );
    });

    it('should handle search query', async () => {
      req.query = { q: 'test', page: 1, limit: 20 };

      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await productController.getProducts(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.any(Array)
      );
    });

    it('should filter by category', async () => {
      req.query = { category: 'Electronics', page: 1, limit: 20 };

      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await productController.getProducts(req, res);

      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('getProductById', () => {
    it('should return product details', async () => {
      req.params.id = '1';

      db.query
        .mockResolvedValueOnce({ rows: [validProduct] })
        .mockResolvedValueOnce({ rows: [] });

      await productController.getProductById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          product: expect.objectContaining({
            id: validProduct.id
          })
        })
      );
    });

    it('should return 404 for non-existent product', async () => {
      req.params.id = '999';
      db.query.mockResolvedValue({ rows: [] });

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      req.body = {
        name: 'New Product',
        description: 'Description',
        category: 'Electronics'
      };

      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          productId: 1
        })
      );
    });

    it('should validate required fields', async () => {
      req.body = { name: 'Test' };

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should only allow vendors to create products', async () => {
      req.user = { id: 1, role: 'CUSTOMER' };
      req.body = {
        name: 'Product',
        description: 'Desc',
        category: 'Cat'
      };

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      req.params.id = '1';
      req.body = { name: 'Updated Name' };

      db.query
        .mockResolvedValueOnce({ rows: [{ ...validProduct, vendor_id: vendor.id }] })
        .mockResolvedValueOnce({ rowCount: 1 });

      await productController.updateProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated')
        })
      );
    });

    it('should prevent updating other vendors products', async () => {
      req.params.id = '1';
      req.body = { name: 'Updated' };

      db.query.mockResolvedValue({ rows: [{ ...validProduct, vendor_id: 999 }] });

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product', async () => {
      req.params.id = '1';

      db.query
        .mockResolvedValueOnce({ rows: [{ ...validProduct, vendor_id: vendor.id }] })
        .mockResolvedValueOnce({ rowCount: 1 });

      await productController.deleteProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should return 404 for non-existent product', async () => {
      req.params.id = '999';
      db.query.mockResolvedValue({ rows: [] });

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
