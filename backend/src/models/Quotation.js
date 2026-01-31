const db = require('../config/database');
const { ApiError } = require('../utils/errors');

class Quotation {
  static async create(client, data) {
    const {
      customer_id,
      vendor_id,
      items,
      subtotal,
      tax,
      total_amount,
      valid_until,
      notes
    } = data;

    const query = `
      INSERT INTO quotations 
      (customer_id, vendor_id, items, subtotal, tax, total_amount, valid_until, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
      RETURNING *;
    `;

    const values = [
      customer_id,
      vendor_id,
      JSON.stringify(items),
      subtotal,
      tax,
      total_amount,
      valid_until,
      notes || ''
    ];

    const result = await (client || db).query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        q.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        v.name as vendor_name,
        v.email as vendor_email,
        v.phone as vendor_phone
      FROM quotations q
      JOIN users c ON q.customer_id = c.id
      LEFT JOIN users v ON q.vendor_id = v.id
      WHERE q.id = $1;
    `;

    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  static async findByCustomer(customerId, { page = 1, limit = 10, status = null } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT q.*, v.name as vendor_name
      FROM quotations q
      LEFT JOIN users v ON q.vendor_id = v.id
      WHERE q.customer_id = $1
    `;
    
    const params = [customerId];
    
    if (status) {
      query += ` AND q.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY q.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findByVendor(vendorId, { page = 1, limit = 10, status = null } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT q.*, c.name as customer_name, c.email as customer_email
      FROM quotations q
      JOIN users c ON q.customer_id = c.id
      WHERE q.vendor_id = $1
    `;
    
    const params = [vendorId];
    
    if (status) {
      query += ` AND q.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY q.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async update(client, id, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['items', 'subtotal', 'tax', 'total_amount', 'valid_until', 'notes', 'status'];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'items') {
          updates.push(`${field} = $${paramIndex++}`);
          values.push(JSON.stringify(data[field]));
        } else {
          updates.push(`${field} = $${paramIndex++}`);
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      throw new ApiError('No fields to update', 400);
    }

    values.push(id);
    const query = `
      UPDATE quotations 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await (client || db).query(query, values);
    if (result.rows.length === 0) {
      throw new ApiError('Quotation not found', 404);
    }

    return result.rows[0];
  }

  static async updateStatus(client, id, status) {
    const query = `
      UPDATE quotations 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const result = await (client || db).query(query, [status, id]);
    if (result.rows.length === 0) {
      throw new ApiError('Quotation not found', 404);
    }

    return result.rows[0];
  }
}

module.exports = Quotation;
