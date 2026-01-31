const OrderService = require('../services/order.service');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const { ApiError } = require('../utils/errors');
const Joi = require('joi');

const createOrderSchema = Joi.object({
  vendor_id: Joi.number().integer().required(),
  items: Joi.array().min(1).items(
    Joi.object({
      variant_id: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required(),
      start_date: Joi.date().iso().required(),
      end_date: Joi.date().iso().greater(Joi.ref('start_date')).required()
    })
  ).required(),
  customer_notes: Joi.string().allow('').optional(),
  billing_address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
    country: Joi.string().optional()
  }).optional(),
  shipping_address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
    country: Joi.string().optional()
  }).optional()
});

const createOrder = async (req, res, next) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    
    if (error) {
      throw new ApiError(error.details[0].message, 400);
    }

    const result = await OrderService.createOrder(req.user.id, value);
    
    if (result.success && result.data) {
      emailService.sendOrderConfirmationEmail(result.data, req.user).catch(err => {
        console.error('Failed to send order confirmation email:', err);
      });
      
      const notification = notificationService.NotificationTemplates.ORDER_CONFIRMED(result.data.order_number);
      notificationService.createNotification({
        userId: req.user.id,
        ...notification
      }).catch(err => {
        console.error('Failed to create order notification:', err);
      });
    }
    
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status
    };

    const result = await OrderService.getCustomerOrders(req.user.id, filters);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await OrderService.getOrderById(
      parseInt(id),
      req.user.id,
      req.user.role
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await OrderService.cancelOrder(
      parseInt(id),
      req.user.id,
      req.user.role
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const confirmOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await OrderService.confirmOrder(
      parseInt(id),
      req.user.id,
      req.user.role
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const markPaymentComplete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await OrderService.markPaymentComplete(
      parseInt(id),
      req.user.id,
      req.body
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  confirmOrder,
  markPaymentComplete
};
