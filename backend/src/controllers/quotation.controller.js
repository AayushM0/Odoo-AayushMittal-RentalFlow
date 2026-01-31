const QuotationService = require('../services/quotation.service');
const { ApiError } = require('../utils/errors');
const Joi = require('joi');

const createQuotationSchema = Joi.object({
  items: Joi.array().min(1).required(),
  vendorId: Joi.number().integer().required(),
  notes: Joi.string().allow('')
});

const createQuotation = async (req, res, next) => {
  try {
    const { error, value } = createQuotationSchema.validate(req.body);
    if (error) {
      throw new ApiError(error.details[0].message, 400);
    }

    const result = await QuotationService.createQuotation(req.user.id, value);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const getQuotations = async (req, res, next) => {
  try {
    let result;
    
    if (req.user.role === 'CUSTOMER') {
      result = await QuotationService.getCustomerQuotations(req.user.id, req.query);
    } else if (req.user.role === 'VENDOR') {
      result = await QuotationService.getVendorQuotations(req.user.id, req.query);
    } else {
      throw new ApiError('Invalid role for quotation list', 403);
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getQuotationById = async (req, res, next) => {
  try {
    const result = await QuotationService.getQuotationById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const approveQuotation = async (req, res, next) => {
  try {
    const result = await QuotationService.approveQuotation(
      req.params.id,
      req.user.id,
      req.body.modifiedData || null
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const rejectQuotation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      throw new ApiError('Rejection reason is required', 400);
    }

    const result = await QuotationService.rejectQuotation(
      req.params.id,
      req.user.id,
      reason
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const convertToOrder = async (req, res, next) => {
  try {
    const result = await QuotationService.convertToOrder(
      req.params.id,
      req.user.id
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  approveQuotation,
  rejectQuotation,
  convertToOrder
};
