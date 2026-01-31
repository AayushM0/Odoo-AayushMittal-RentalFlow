const db = require('../config/database');
const { AppError } = require('../utils/errors');

class Product {
  static async create(client, data) {
    const { 
      vendor_id, name, description, category, brand, is_published, images 
    } = data;
    
    const query = `
      INSERT INTO products 
      (vendor_id, name, description, category, brand, is_published, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const values = [
      vendor_id, 
      name, 
      description, 
      category, 
      brand, 
      is_published || false, 
      JSON.stringify(images || [])
    ];
    
    const result = await (client || db).query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        p.*,
        COALESCE(json_agg(v.*) FILTER (WHERE v.id IS NOT NULL), '[]') as variants,
        u.name as vendor_name
      FROM products p
      LEFT JOIN variants v ON p.id = v.product_id
      LEFT JOIN users u ON p.vendor_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, u.name;
    `;
    
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  static async createVariant(client, productId, data) {
    const { 
      sku, attributes, 
      price_hourly, price_daily, price_weekly, price_monthly, 
      stock_quantity 
    } = data;
    
    const query = `
      INSERT INTO variants 
      (product_id, sku, attributes, price_hourly, price_daily, price_weekly, price_monthly, stock_quantity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    
    const values = [
      productId, 
      sku, 
      JSON.stringify(attributes || {}), 
      price_hourly, 
      price_daily, 
      price_weekly, 
      price_monthly, 
      stock_quantity || 0
    ];
    
    const result = await (client || db).query(query, values);
    return result.rows[0];
  }

  static async updateVariant(client, variantId, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (data.sku !== undefined) {
      updates.push(`sku = $${paramIndex++}`);
      values.push(data.sku);
    }
    if (data.attributes !== undefined) {
      updates.push(`attributes = $${paramIndex++}`);
      values.push(JSON.stringify(data.attributes));
    }
    if (data.price_hourly !== undefined) {
      updates.push(`price_hourly = $${paramIndex++}`);
      values.push(data.price_hourly);
    }
    if (data.price_daily !== undefined) {
      updates.push(`price_daily = $${paramIndex++}`);
      values.push(data.price_daily);
    }
    if (data.price_weekly !== undefined) {
      updates.push(`price_weekly = $${paramIndex++}`);
      values.push(data.price_weekly);
    }
    if (data.price_monthly !== undefined) {
      updates.push(`price_monthly = $${paramIndex++}`);
      values.push(data.price_monthly);
    }
    if (data.stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramIndex++}`);
      values.push(data.stock_quantity);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(variantId);
    const query = `
      UPDATE variants 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await (client || db).query(query, values);
    if (result.rows.length === 0) {
      throw new AppError('Variant not found', 404);
    }
    return result.rows[0];
  }

  static async findAll({ page = 1, limit = 10, search, category, brand, minPrice, maxPrice }) {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClauses = ['is_published = true'];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      whereClauses.push(`p.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (brand) {
      whereClauses.push(`p.brand = $${paramIndex}`);
      params.push(brand);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) FROM products p ${whereSql}`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count);

    let havingClause = '';
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceConditions = [];
      if (minPrice !== undefined) {
        priceConditions.push(`MIN(v.price_daily) >= $${paramIndex}`);
        params.push(minPrice);
        paramIndex++;
      }
      if (maxPrice !== undefined) {
        priceConditions.push(`MIN(v.price_daily) <= $${paramIndex}`);
        params.push(maxPrice);
        paramIndex++;
      }
      havingClause = `HAVING ${priceConditions.join(' AND ')}`;
    }

    const dataQuery = `
      SELECT p.*, MIN(v.price_daily) as min_daily_price
      FROM products p
      LEFT JOIN variants v ON p.id = v.product_id
      ${whereSql}
      GROUP BY p.id
      ${havingClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataRes = await db.query(dataQuery, [...params, limit, offset]);

    return {
      products: dataRes.rows,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    };
  }

  static async update(client, id, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.brand !== undefined) {
      updates.push(`brand = $${paramIndex++}`);
      values.push(data.brand);
    }
    if (data.is_published !== undefined) {
      updates.push(`is_published = $${paramIndex++}`);
      values.push(data.is_published);
    }
    if (data.images !== undefined) {
      updates.push(`images = $${paramIndex++}`);
      values.push(JSON.stringify(data.images));
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(id);
    const query = `
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await (client || db).query(query, values);
    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }
    return result.rows[0];
  }

  static async delete(client, id) {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *;';
    const result = await (client || db).query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }
    return result.rows[0];
  }
}

module.exports = Product;
