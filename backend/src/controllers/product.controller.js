const ProductService = require('../services/product.service');
const { ApiError } = require('../utils/errors');
const { product: productSchemas } = require('../database/schemas');

const { createProductSchema, updateProductSchema } = productSchemas;

const createProduct = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      throw new ApiError(error.details[0].message, 400);
    }

    // Extract variants from validated data
    const { variants, ...productData } = value;

    // Call service
    const result = await ProductService.createProduct(
      req.user.id,
      productData,
      variants
    );

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      category: req.query.category,
      brand: req.query.brand,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined
    };

    const result = await ProductService.getProducts(
      filters,
      req.user?.id,
      req.user?.role
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await ProductService.getProductById(
      id,
      req.user?.id,
      req.user?.role
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      throw new ApiError(error.details[0].message, 400);
    }

    const result = await ProductService.updateProduct(
      id,
      req.user.id,
      req.user.role,
      value
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await ProductService.deleteProduct(
      id,
      req.user.id,
      req.user.role
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
