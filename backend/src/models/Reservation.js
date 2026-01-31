const pool = require('../config/database');
const { ApiError } = require('../utils/errors');

class Reservation {
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM reservations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByOrder(orderId) {
    const result = await pool.query(
      'SELECT * FROM reservations WHERE order_id = $1 ORDER BY id',
      [orderId]
    );
    return result.rows;
  }

  static async create(client, data) {
    const {
      order_id,
      variant_id,
      start_date,
      end_date,
      quantity,
      status = 'RESERVED'
    } = data;

    const query = `
      INSERT INTO reservations 
      (order_id, variant_id, start_date, end_date, quantity, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [order_id, variant_id, start_date, end_date, quantity, status];
    const result = await (client || pool).query(query, values);
    return result.rows[0];
  }

  static async updateStatus(client, id, status) {
    const query = `
      UPDATE reservations 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const result = await (client || pool).query(query, [status, id]);

    if (result.rows.length === 0) {
      throw new ApiError('Reservation not found', 404);
    }

    return result.rows[0];
  }
}

module.exports = Reservation;
