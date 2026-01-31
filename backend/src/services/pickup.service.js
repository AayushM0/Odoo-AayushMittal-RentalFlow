const pool = require('../config/database');
const { ApiError } = require('../utils/errors');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');

class PickupService {
  
  async recordPickup(vendorId, userRole, pickupData) {
    const { orderId, reservationIds, pickedUpBy, notes } = pickupData;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new ApiError('Order not found', 404);
      }
      
      if (userRole !== 'ADMIN' && order.vendor_id !== vendorId) {
        throw new ApiError('You can only manage pickups for your own products', 403);
      }
      
      if (order.status !== 'CONFIRMED') {
        throw new ApiError(`Cannot pickup order with status: ${order.status}. Only CONFIRMED orders can be picked up.`, 400);
      }
      
      const pickupRecords = [];
      
      if (!reservationIds || reservationIds.length === 0) {
        const orderReservations = await Reservation.findByOrder(orderId);
        
        for (const reservation of orderReservations) {
          const pickupResult = await client.query(
            `INSERT INTO pickups (
              order_id, reservation_id, picked_up_by, notes, picked_up_at
            ) VALUES ($1, $2, $3, $4, NOW())
            RETURNING *`,
            [orderId, reservation.id, pickedUpBy, notes]
          );
          
          pickupRecords.push(pickupResult.rows[0]);
        }
      } else {
        for (const reservationId of reservationIds) {
          const reservation = await Reservation.findById(reservationId);
          
          if (!reservation) {
            throw new ApiError(`Reservation ${reservationId} not found`, 404);
          }
          
          if (reservation.order_id !== orderId) {
            throw new ApiError(`Reservation ${reservationId} does not belong to order ${orderId}`, 400);
          }
          
          const pickupResult = await client.query(
            `INSERT INTO pickups (
              order_id, reservation_id, picked_up_by, notes, picked_up_at
            ) VALUES ($1, $2, $3, $4, NOW())
            RETURNING *`,
            [orderId, reservationId, pickedUpBy, notes]
          );
          
          pickupRecords.push(pickupResult.rows[0]);
        }
      }
      
      await Order.updateStatus(client, orderId, 'PICKED_UP');
      
      await client.query('COMMIT');
      
      const updatedOrder = await Order.findById(orderId);
      
      return {
        order: updatedOrder,
        pickups: pickupRecords
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPendingPickups(vendorId) {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.created_at,
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
            'status', r.status
          )
        ) as reservations
      FROM orders o
      JOIN users c ON o.customer_id = c.id
      LEFT JOIN reservations r ON r.order_id = o.id
      WHERE o.vendor_id = $1
        AND o.status = 'CONFIRMED'
      GROUP BY o.id, c.id
      ORDER BY o.created_at ASC`,
      [vendorId]
    );
    
    return result.rows;
  }

  async getPickupHistory(vendorId, filters = {}) {
    const { page = 1, limit = 20, orderId } = filters;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE o.vendor_id = $1 AND o.status IN ($2, $3, $4)';
    const params = [vendorId, 'PICKED_UP', 'RETURNED', 'COMPLETED'];
    
    if (orderId) {
      whereClause += ' AND o.id = $5';
      params.push(orderId);
    }
    
    const query = `
      SELECT 
        p.id as pickup_id,
        p.picked_up_at,
        p.picked_up_by,
        p.notes,
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
      FROM pickups p
      JOIN orders o ON p.order_id = o.id
      JOIN users c ON o.customer_id = c.id
      JOIN reservations r ON p.reservation_id = r.id
      ${whereClause}
      ORDER BY p.picked_up_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM pickups p
       JOIN orders o ON p.order_id = o.id
       ${whereClause}`,
      params.slice(0, orderId ? 5 : 4)
    );
    
    return {
      pickups: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }

  async getPickupById(pickupId, vendorId, userRole) {
    const result = await pool.query(
      `SELECT 
        p.*,
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
        ) as reservation
      FROM pickups p
      JOIN orders o ON p.order_id = o.id
      JOIN users c ON o.customer_id = c.id
      JOIN reservations r ON p.reservation_id = r.id
      WHERE p.id = $1`,
      [pickupId]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError('Pickup record not found', 404);
    }
    
    const pickup = result.rows[0];
    
    if (userRole !== 'ADMIN' && pickup.vendor_id !== vendorId) {
      throw new ApiError('Access denied', 403);
    }
    
    return pickup;
  }
}

module.exports = new PickupService();
