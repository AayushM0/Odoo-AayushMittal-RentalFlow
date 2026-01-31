const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/database');
const { ApiError } = require('../utils/errors');
const invoiceService = require('./invoice.service');
const Order = require('../models/Order');

class PaymentService {
  constructor() {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    } else {
      console.warn('Razorpay credentials not found. Payment service will be limited.');
      this.razorpay = null;
    }
  }

  async createPaymentOrder(orderId) {
    if (!this.razorpay) {
      throw new ApiError('Payment gateway not configured', 500);
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new ApiError('Order not found', 404);
    }
    
    if (order.status !== 'PENDING' && order.status !== 'DRAFT') {
      throw new ApiError(`Order is already ${order.status}`, 400);
    }
    
    let invoice = await pool.query(
      'SELECT * FROM invoices WHERE order_id = $1',
      [orderId]
    );
    
    let invoiceData;
    if (invoice.rows.length === 0) {
      console.log(`No invoice found for order ${orderId}, creating one...`);
      invoiceData = await invoiceService.generateInvoice(orderId);
    } else {
      invoiceData = invoice.rows[0];
    }
    const amountInPaise = Math.round(parseFloat(invoiceData.amount_due) * 100);
    
    const razorpayOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${order.order_number}`,
      notes: {
        order_id: orderId,
        invoice_id: invoiceData.id,
        order_number: order.order_number
      }
    });
    
    await pool.query(
      `INSERT INTO payments (
        order_id, invoice_id, amount, payment_method, 
        transaction_id, status, gateway_response
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        orderId,
        invoiceData.id,
        invoiceData.amount_due,
        'razorpay',
        razorpayOrder.id,
        'PENDING',
        JSON.stringify(razorpayOrder)
      ]
    );
    
    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
      invoice: invoiceData
    };
  }

  async verifyPayment(paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      throw new ApiError('Invalid payment signature', 400);
    }
    
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE transaction_id = $1',
      [razorpay_order_id]
    );
    
    if (paymentResult.rows.length === 0) {
      throw new ApiError('Payment record not found', 404);
    }
    
    const payment = paymentResult.rows[0];
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      await client.query(
        `UPDATE payments 
         SET status = $1, 
             paid_at = NOW(),
             gateway_response = $2
         WHERE id = $3`,
        [
          'SUCCESS',
          JSON.stringify({ razorpay_payment_id, razorpay_signature }),
          payment.id
        ]
      );
      
      await invoiceService.recordPayment(payment.invoice_id, {
        amount: payment.amount,
        paymentMethod: 'razorpay',
        transactionId: razorpay_payment_id
      });
      
      await Order.updateStatus(client, payment.order_id, 'CONFIRMED');
      
      const invoiceCheck = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [payment.invoice_id]
      );
      
      if (invoiceCheck.rows.length > 0 && !invoiceCheck.rows[0].pdf_url) {
        setTimeout(async () => {
          try {
            await invoiceService.generatePDF(payment.invoice_id);
            await invoiceService.sendInvoiceEmail(payment.invoice_id);
          } catch (err) {
            console.error('Failed to send invoice:', err);
          }
        }, 2000);
      }
      
      await client.query('COMMIT');
      
      const updatedOrder = await Order.findById(payment.order_id);
      
      return {
        success: true,
        order: updatedOrder,
        payment: razorpay_payment_id
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async handleWebhook(signature, payload) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret')
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      throw new ApiError('Invalid webhook signature', 400);
    }
    
    const event = payload.event;
    const paymentEntity = payload.payload.payment.entity;
    
    if (event === 'payment.captured') {
      const paymentData = {
        razorpay_order_id: paymentEntity.order_id,
        razorpay_payment_id: paymentEntity.id,
        razorpay_signature: signature
      };
      
      await this.verifyPayment(paymentData);
    } else if (event === 'payment.failed') {
      await pool.query(
        `UPDATE payments 
         SET status = $1, gateway_response = $2
         WHERE transaction_id = $3`,
        ['FAILED', JSON.stringify(paymentEntity), paymentEntity.order_id]
      );
    }
    
    return { received: true };
  }

  async createRefund(paymentId, amount, reason) {
    if (!this.razorpay) {
      throw new ApiError('Payment gateway not configured', 500);
    }

    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE id = $1 AND status = $2',
      [paymentId, 'SUCCESS']
    );
    
    if (paymentResult.rows.length === 0) {
      throw new ApiError('Payment not found or not eligible for refund', 404);
    }
    
    const payment = paymentResult.rows[0];
    const gatewayResponse = JSON.parse(payment.gateway_response || '{}');
    const razorpayPaymentId = gatewayResponse.razorpay_payment_id;
    
    if (!razorpayPaymentId) {
      throw new ApiError('Razorpay payment ID not found', 400);
    }
    
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    
    const refund = await this.razorpay.payments.refund(razorpayPaymentId, {
      amount: amountInPaise,
      notes: {
        reason: reason || 'Order cancellation'
      }
    });
    
    await pool.query(
      `UPDATE payments 
       SET status = $1, gateway_response = $2
       WHERE id = $3`,
      ['REFUNDED', JSON.stringify({ ...gatewayResponse, refund }), paymentId]
    );
    
    await pool.query(
      `UPDATE invoices 
       SET status = $1, amount_paid = amount_paid - $2, amount_due = amount_due + $2
       WHERE id = $3`,
      ['CANCELLED', amount, payment.invoice_id]
    );
    
    return {
      success: true,
      refund_id: refund.id,
      amount: amount,
      status: refund.status
    };
  }

  async getPaymentStatus(orderId) {
    const result = await pool.query(
      `SELECT 
        p.*,
        i.invoice_number,
        o.order_number
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN orders o ON p.order_id = o.id
      WHERE p.order_id = $1
      ORDER BY p.created_at DESC`,
      [orderId]
    );
    
    return result.rows;
  }
}

module.exports = new PaymentService();
