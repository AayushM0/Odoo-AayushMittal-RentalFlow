const paymentService = require('../services/payment.service');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const pool = require('../config/database');
const { ApiError } = require('../utils/errors');

exports.createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;
    
    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
      [orderId, userId]
    );
    
    if (order.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or order not found'
      });
    }
    
    const paymentData = await paymentService.createPaymentOrder(orderId);
    
    res.status(201).json({
      success: true,
      data: paymentData
    });
    
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const result = await paymentService.verifyPayment(req.body);
    
    if (result && result.payment && result.order && result.customer) {
      emailService.sendPaymentConfirmationEmail(result.payment, result.order, result.customer).catch(err => {
        console.error('Failed to send payment confirmation email:', err);
      });
      
      const notification = notificationService.NotificationTemplates.PAYMENT_SUCCESS(
        result.payment.amount,
        result.order.id,
        result.order.order_number
      );
      notificationService.createNotification({
        userId: result.customer.id,
        ...notification
      }).catch(err => {
        console.error('Failed to create payment notification:', err);
      });
    }
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing signature'
      });
    }
    
    await paymentService.handleWebhook(signature, req.body);
    
    res.json({ received: true });
    
  } catch (error) {
    next(error);
  }
};

exports.createRefund = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;
    const userRole = req.user.role;
    
    if (userRole !== 'ADMIN' && userRole !== 'VENDOR') {
      return res.status(403).json({
        success: false,
        error: 'Only vendors and admins can process refunds'
      });
    }
    
    const result = await paymentService.createRefund(paymentId, amount, reason);
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (order.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    if (userRole !== 'ADMIN' && 
        order.rows[0].customer_id !== userId && 
        order.rows[0].vendor_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const payments = await paymentService.getPaymentStatus(orderId);
    
    res.json({
      success: true,
      data: payments
    });
    
  } catch (error) {
    next(error);
  }
};
