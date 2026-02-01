const pool = require('../config/database');
const { ApiError } = require('../utils/errors');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const notificationService = require('./notification.service');

class ReturnService {
  
  calculateLateFee(endDate, returnDate, basePrice, lateFeeRate = 0.20) {
    const end = new Date(endDate);
    const returned = new Date(returnDate);
    
    if (returned <= end) {
      return { isLate: false, lateFee: 0, daysLate: 0 };
    }
    
    const diffMs = returned - end;
    const daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const lateFee = basePrice * lateFeeRate * daysLate;
    
    return {
      isLate: true,
      lateFee: parseFloat(lateFee.toFixed(2)),
      daysLate
    };
  }

  async recordReturn(vendorId, userRole, returnData) {
    const { orderId, reservationId, pickupId, conditionNotes } = returnData;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }
      
      if (userRole !== 'ADMIN' && order.vendor_id !== vendorId) {
        throw new ApiError(403, 'You can only manage returns for your own products');
      }
      
      if (order.status !== 'PICKED_UP') {
        throw new ApiError(400, `Cannot return order with status: ${order.status}. Only PICKED_UP orders can be returned.`);
      }
      
      const reservation = await Reservation.findById(reservationId);
      
      if (!reservation) {
        throw new ApiError(404, 'Reservation not found');
      }
      
      if (reservation.order_id !== orderId) {
        throw new ApiError(400, 'Reservation does not belong to this order');
      }
      
      if (reservation.status === 'COMPLETED') {
        throw new ApiError(400, 'This reservation has already been returned');
      }
      
      if (pickupId) {
        const pickupCheck = await client.query(
          'SELECT * FROM pickups WHERE id = $1 AND reservation_id = $2',
          [pickupId, reservationId]
        );
        
        if (pickupCheck.rows.length === 0) {
          throw new ApiError(400, 'Pickup record not found or does not match reservation');
        }
      }
      
      const returnedAt = new Date();
      
      const basePrice = parseFloat(order.total_amount);
      
      const lateInfo = this.calculateLateFee(
        reservation.end_date,
        returnedAt,
        basePrice
      );
      
      const returnResult = await client.query(
        `INSERT INTO returns (
          order_id, reservation_id, pickup_id, returned_at,
          is_late, late_fee, condition_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          orderId,
          reservationId,
          pickupId || null,
          returnedAt,
          lateInfo.isLate,
          lateInfo.lateFee,
          conditionNotes
        ]
      );
      
      await client.query(
        'UPDATE reservations SET status = $1 WHERE id = $2',
        ['COMPLETED', reservationId]
      );
      
      if (lateInfo.isLate && lateInfo.lateFee > 0) {
        const invoiceResult = await client.query(
          'SELECT * FROM invoices WHERE order_id = $1',
          [orderId]
        );
        
        if (invoiceResult.rows.length > 0) {
          const invoice = invoiceResult.rows[0];
          
          const lineItems = JSON.parse(invoice.line_items || '[]');
          lineItems.push({
            description: `Late Fee - ${lateInfo.daysLate} day(s) late`,
            quantity: 1,
            unit_price: lateInfo.lateFee,
            total: lateInfo.lateFee
          });
          
          const newTotal = parseFloat(invoice.total_amount) + lateInfo.lateFee;
          const newDue = parseFloat(invoice.amount_due) + lateInfo.lateFee;
          
          await client.query(
            `UPDATE invoices 
             SET line_items = $1, 
                 total_amount = $2, 
                 amount_due = $3,
                 updated_at = NOW()
             WHERE id = $4`,
            [JSON.stringify(lineItems), newTotal, newDue, invoice.id]
          );
        }
      }
      
      const allReservations = await client.query(
        'SELECT * FROM reservations WHERE order_id = $1',
        [orderId]
      );
      
      const allCompleted = allReservations.rows.every(
        res => res.status === 'COMPLETED' || res.status === 'CANCELLED'
      );
      
      if (allCompleted) {
        await Order.updateStatus(client, orderId, 'RETURNED');
      }
      
      await client.query('COMMIT');
      
      const updatedOrder = await Order.findById(orderId);
      
      // Send notification to customer about return
      try {
        let notificationMessage = `Your order #${order.order_number} has been returned successfully.`;
        let notificationType = 'SUCCESS';
        
        if (lateInfo.isLate) {
          notificationMessage += ` Late fee of ₹${lateInfo.lateFee} applied for ${lateInfo.daysLate} day(s) late return.`;
          notificationType = 'WARNING';
        }
        
        const notification = {
          type: notificationType,
          title: 'Order Returned',
          message: notificationMessage,
          link: `/orders/${orderId}`
        };
        await notificationService.createNotification({
          userId: order.customer_id,
          ...notification
        });
      } catch (notifErr) {
        console.error('Failed to create return notification:', notifErr);
      }
      
      return {
        return: returnResult.rows[0],
        order: updatedOrder,
        lateInfo
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPendingReturns(vendorId) {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone
        ) as customer,
        json_agg(
          json_build_object(
            'id', r.id,
            'variant_id', r.variant_id,
            'start_date', r.start_date,
            'end_date', r.end_date,
            'quantity', r.quantity,
            'status', r.status,
            'is_overdue', (r.end_date < NOW() AND r.status = 'ACTIVE')
          ) ORDER BY r.end_date ASC
        ) as reservations,
        MIN(r.end_date) as earliest_return_date,
        BOOL_OR(r.end_date < NOW() AND r.status = 'ACTIVE') as has_overdue
      FROM orders o
      JOIN users c ON o.customer_id = c.id
      LEFT JOIN reservations r ON r.order_id = o.id
      WHERE o.vendor_id = $1
        AND o.status = 'PICKED_UP'
      GROUP BY o.id, c.id
      ORDER BY has_overdue DESC, earliest_return_date ASC`,
      [vendorId]
    );
    
    return result.rows;
  }

  async getReturnHistory(vendorId, filters = {}) {
    const { page = 1, limit = 20, orderId } = filters;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE o.vendor_id = $1';
    const params = [vendorId];
    
    if (orderId) {
      whereClause += ' AND o.id = $2';
      params.push(orderId);
    }
    
    const query = `
      SELECT 
        ret.id as return_id,
        ret.returned_at,
        ret.is_late,
        ret.late_fee,
        ret.condition_notes,
        o.id as order_id,
        o.order_number,
        o.status as order_status,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email
        ) as customer,
        json_build_object(
          'id', r.id,
          'variant_id', r.variant_id,
          'start_date', r.start_date,
          'end_date', r.end_date,
          'quantity', r.quantity
        ) as reservation
      FROM returns ret
      JOIN orders o ON ret.order_id = o.id
      JOIN users c ON o.customer_id = c.id
      JOIN reservations r ON ret.reservation_id = r.id
      ${whereClause}
      ORDER BY ret.returned_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT ret.id) as total
       FROM returns ret
       JOIN orders o ON ret.order_id = o.id
       ${whereClause}`,
      params.slice(0, orderId ? 2 : 1)
    );
    
    return {
      returns: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }

  async getReturnById(returnId, vendorId, userRole) {
    const result = await pool.query(
      `SELECT 
        ret.*,
        o.order_number,
        o.vendor_id,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone
        ) as customer,
        json_build_object(
          'id', r.id,
          'variant_id', r.variant_id,
          'start_date', r.start_date,
          'end_date', r.end_date,
          'quantity', r.quantity
        ) as reservation,
        json_build_object(
          'id', p.id,
          'picked_up_at', p.picked_up_at,
          'picked_up_by', p.picked_up_by
        ) as pickup
      FROM returns ret
      JOIN orders o ON ret.order_id = o.id
      JOIN users c ON o.customer_id = c.id
      JOIN reservations r ON ret.reservation_id = r.id
      LEFT JOIN pickups p ON ret.pickup_id = p.id
      WHERE ret.id = $1`,
      [returnId]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Return record not found');
    }
    
    const returnRecord = result.rows[0];
    
    if (userRole !== 'ADMIN' && returnRecord.vendor_id !== vendorId) {
      throw new ApiError(403, 'Access denied');
    }
    
    return returnRecord;
  }
}

module.exports = new ReturnService();
