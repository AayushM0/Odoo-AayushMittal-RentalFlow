const pool = require('../config/database');
const Order = require('../models/Order');
const reservationService = require('./reservation.service');
const { ApiError } = require('../utils/errors');

class OrderService {
  static generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${dateStr}-${random}`;
  }

  static calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity * item.duration);
    }, 0);

    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  static async createOrder(customerId, orderData) {
    const { items, vendor_id, billing_address, shipping_address, customer_notes } = orderData;

    if (!items || items.length === 0) {
      throw new ApiError('Order must have at least one item', 400);
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const enrichedItems = [];
      let vendorId = null;

      for (const item of items) {
        const variantQuery = await client.query(
          `SELECT v.*, p.vendor_id 
           FROM variants v 
           JOIN products p ON v.product_id = p.id 
           WHERE v.id = $1`,
          [item.variant_id]
        );

        if (variantQuery.rows.length === 0) {
          throw new ApiError(`Variant ${item.variant_id} not found`, 404);
        }

        const variant = variantQuery.rows[0];

        if (vendorId === null) {
          vendorId = variant.vendor_id;
        } else if (vendorId !== variant.vendor_id) {
          throw new ApiError('All items must be from the same vendor', 400);
        }

        const startDate = new Date(item.start_date);
        const endDate = new Date(item.end_date);
        const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        const pricePerDay = variant.price_daily || variant.price_per_day || 0;

        enrichedItems.push({
          ...item,
          price: pricePerDay,
          duration: durationDays
        });
      }

      const orderNumber = this.generateOrderNumber();

      const { total } = this.calculateTotals(enrichedItems);

      const startDate = new Date(Math.min(...items.map(i => new Date(i.start_date))));
      const endDate = new Date(Math.max(...items.map(i => new Date(i.end_date))));

      const order = await Order.create(client, {
        customer_id: customerId,
        vendor_id: vendor_id || vendorId,
        order_number: orderNumber,
        total_amount: total,
        start_date: startDate,
        end_date: endDate,
        status: 'PENDING',
        billing_address: billing_address || null,
        shipping_address: shipping_address || null,
        customer_notes: customer_notes || null
      });

      const reservationItems = items.map(item => ({
        variantId: item.variant_id,
        quantity: item.quantity,
        startDate: item.start_date,
        endDate: item.end_date
      }));

      const reservationResult = await reservationService.createReservationWithClient(
        client,
        order.id,
        reservationItems
      );

      if (!reservationResult.success) {
        throw new ApiError(
          reservationResult.error || 'Unable to reserve items. Please check availability and try again.',
          400
        );
      }

      await client.query('COMMIT');

      const completeOrder = await Order.findById(order.id);

      return {
        success: true,
        data: completeOrder
      };

    } catch (error) {
      await client.query('ROLLBACK');
      
      console.error('Order creation error:', error);
      
      if (error.statusCode) {
        throw error;
      }
      
      throw new ApiError(error.message || 'Order creation failed', 500);
    } finally {
      client.release();
    }
  }

  static async getOrderById(id, userId, userRole) {
    try {
      const order = await Order.findById(id);

      if (!order) {
        throw new ApiError('Order not found', 404);
      }

      if (userRole !== 'ADMIN' && order.customer_id !== userId) {
        throw new ApiError('Not authorized to view this order', 403);
      }

      return {
        success: true,
        data: order
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Failed to fetch order', 500);
    }
  }

  static async getCustomerOrders(customerId, filters = {}) {
    try {
      const orders = await Order.findByCustomer(customerId, filters);

      return {
        success: true,
        data: orders
      };
    } catch (error) {
      throw new ApiError(error.message || 'Failed to fetch orders', 500);
    }
  }

  static async cancelOrder(id, userId, userRole) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const order = await Order.findById(id);

      if (!order) {
        throw new ApiError('Order not found', 404);
      }

      if (userRole !== 'ADMIN' && order.customer_id !== userId) {
        throw new ApiError('Not authorized to cancel this order', 403);
      }

      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new ApiError(`Cannot cancel order with status: ${order.status}`, 400);
      }

      const cancelResult = await reservationService.cancelReservationsByOrder(id);

      if (!cancelResult.success) {
        throw new ApiError(cancelResult.error, 500);
      }

      const cancelledOrder = await Order.updateStatus(client, id, 'CANCELLED');

      await client.query('COMMIT');

      return {
        success: true,
        data: cancelledOrder,
        message: `Order cancelled. ${cancelResult.cancelled || 0} reservations released.`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Cancellation failed', 500);
    } finally {
      client.release();
    }
  }

  static async confirmOrder(orderId, userId, userRole) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new ApiError('Order not found', 404);
      }
      
      if (userRole !== 'ADMIN' && order.vendor_id !== userId) {
        throw new ApiError('Only vendor or admin can confirm orders', 403);
      }
      
      if (order.status !== 'PENDING') {
        throw new ApiError(`Cannot confirm order with status: ${order.status}`, 400);
      }
      
      await Order.updateStatus(client, orderId, 'CONFIRMED');
      
      const invoiceService = require('./invoice.service');
      const invoice = await invoiceService.generateInvoice(orderId, client);
      
      await client.query('COMMIT');
      
      setTimeout(async () => {
        try {
          await invoiceService.generatePDF(invoice.id);
          await invoiceService.sendInvoiceEmail(invoice.id);
        } catch (err) {
          console.error('Failed to send invoice email:', err);
        }
      }, 1000);
      
      return {
        success: true,
        data: {
          order: await Order.findById(orderId),
          invoice
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Order confirmation failed', 500);
    } finally {
      client.release();
    }
  }

  static async markPaymentComplete(orderId, userId, paymentData = {}) {
    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new ApiError('Order not found', 404);
      }
      
      if (order.customer_id !== userId) {
        throw new ApiError('Not authorized to update this order', 403);
      }
      
      const query = `
        UPDATE orders 
        SET payment_status = 'PAID',
            payment_method = $1,
            payment_id = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `;
      
      const result = await pool.query(query, [
        paymentData.method || 'Manual',
        paymentData.paymentId || `PAY-${Date.now()}`,
        orderId
      ]);
      
      return {
        success: true,
        data: result.rows[0],
        message: 'Payment marked as completed'
      };
      
    } catch (error) {
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Payment update failed', 500);
    }
  }
}

module.exports = OrderService;
