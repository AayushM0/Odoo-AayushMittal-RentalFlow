const pool = require('../config/database');
const { ApiError } = require('../utils/errors');

class Order {
  static async create(client, data) {
    const {
      customer_id,
      vendor_id,
      order_number,
      total_amount,
      start_date,
      end_date,
      status = 'PENDING',
      billing_address,
      shipping_address,
      customer_notes
    } = data;

    const query = `
      INSERT INTO orders 
      (customer_id, vendor_id, order_number, total_amount, start_date, end_date, status, billing_address, shipping_address, customer_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const values = [
      customer_id,
      vendor_id,
      order_number,
      total_amount,
      start_date,
      end_date,
      status,
      billing_address,
      shipping_address,
      customer_notes
    ];

    const result = await (client || pool).query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        v.name as vendor_name,
        COALESCE(json_agg(
          json_build_object(
            'id', r.id,
            'variant_id', r.variant_id,
            'start_date', r.start_date,
            'end_date', r.end_date,
            'quantity', r.quantity,
            'status', r.status,
            'variant_sku', vr.sku,
            'product_name', p.name
          )
        ) FILTER (WHERE r.id IS NOT NULL), '[]') as reservations,
        COALESCE(json_agg(
          json_build_object(
            'variant_id', r.variant_id,
            'quantity', r.quantity,
            'product_name', p.name,
            'line_total', 0,
            'price_per_unit', 0
          )
        ) FILTER (WHERE r.id IS NOT NULL), '[]') as items
      FROM orders o
      JOIN users c ON o.customer_id = c.id
      LEFT JOIN users v ON o.vendor_id = v.id
      LEFT JOIN reservations r ON o.id = r.order_id
      LEFT JOIN variants vr ON r.variant_id = vr.id
      LEFT JOIN products p ON vr.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, c.name, c.email, c.phone, v.name;
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  static async findByCustomer(customerId, { page = 1, limit = 10, status = null } = {}) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT o.*, v.name as vendor_name,
             COUNT(r.id) as reservation_count
      FROM orders o
      LEFT JOIN users v ON o.vendor_id = v.id
      LEFT JOIN reservations r ON o.id = r.order_id
      WHERE o.customer_id = $1
    `;

    const params = [customerId];

    if (status) {
      query += ` AND o.status = $2`;
      params.push(status);
    }

    query += ` GROUP BY o.id, v.name ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(client, id, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['total_amount', 'start_date', 'end_date', 'status'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) {
      throw new ApiError('No fields to update', 400);
    }

    values.push(id);

    const query = `
      UPDATE orders 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await (client || pool).query(query, values);

    if (result.rows.length === 0) {
      throw new ApiError('Order not found', 404);
    }

    return result.rows[0];
  }

  static async updateStatus(client, id, status) {
    const query = `
      UPDATE orders 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const result = await (client || pool).query(query, [status, id]);

    if (result.rows.length === 0) {
      throw new ApiError('Order not found', 404);
    }

    return result.rows[0];
  }

  static async delete(client, id) {
    const query = 'DELETE FROM orders WHERE id = $1 RETURNING *;';
    const result = await (client || pool).query(query, [id]);

    if (result.rows.length === 0) {
      throw new ApiError('Order not found', 404);
    }

    return result.rows[0];
  }
}

module.exports = Order;
