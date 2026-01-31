const QuotationService = require('../services/quotation.service');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const { ApiError } = require('../utils/errors');
const Joi = require('joi');

const createQuotationSchema = Joi.object({
  items: Joi.array().min(1).required(),
  vendor_id: Joi.number().integer().required(),
  notes: Joi.string().allow('')
});

const createQuotation = async (req, res, next) => {
  try {
    console.log('📝 Creating quotation - Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.user.id);
    
    const { error, value } = createQuotationSchema.validate(req.body);
    if (error) {
      console.error('❌ Validation error:', error.details[0].message);
      throw new ApiError(error.details[0].message, 400);
    }

    console.log('✅ Validation passed, creating quotation...');
    const result = await QuotationService.createQuotation(req.user.id, value);
    console.log('✅ Quotation created successfully');
    res.status(201).json(result);
  } catch (err) {
    console.error('❌ Quotation creation error:', err.message);
    console.error('Stack:', err.stack);
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
    
    if (result.success && result.data && result.data.customer) {
      emailService.sendQuotationStatusEmail(result.data, result.data.customer, 'APPROVED').catch(err => {
        console.error('Failed to send quotation approval email:', err);
      });
      
      const notification = notificationService.NotificationTemplates.QUOTATION_APPROVED(result.data.id);
      notificationService.createNotification({
        userId: result.data.customer_id,
        ...notification
      }).catch(err => {
        console.error('Failed to create quotation approval notification:', err);
      });
    }
    
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
    
    if (result.success && result.data && result.data.customer) {
      emailService.sendQuotationStatusEmail(result.data, result.data.customer, 'REJECTED').catch(err => {
        console.error('Failed to send quotation rejection email:', err);
      });
      
      const notification = notificationService.NotificationTemplates.QUOTATION_REJECTED(result.data.id);
      notificationService.createNotification({
        userId: result.data.customer_id,
        ...notification
      }).catch(err => {
        console.error('Failed to create quotation rejection notification:', err);
      });
    }
    
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
