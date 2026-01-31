const db = require('../config/database');

exports.searchProducts = async (req, res) => {
  try {
    const {
      q = '',
      category,
      min_price,
      max_price,
      availability = 'all',
      sort = 'relevance',
      page = 1,
      limit = 20
    } = req.query;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.vendor_id,
        u.name as vendor_name,
        MIN(v.price_daily) as min_price,
        MAX(v.price_daily) as max_price,
        SUM(v.stock_quantity) as total_stock,
        p.created_at
      FROM products p
      JOIN variants v ON p.id = v.product_id
      JOIN users u ON p.vendor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      query += ` AND (
        p.name ILIKE $${params.length + 1} OR 
        p.description ILIKE $${params.length + 2} OR 
        p.category ILIKE $${params.length + 3}
      )`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += ` AND p.category = $${params.length + 1}`;
      params.push(category);
    }

    if (min_price) {
      query += ` AND v.price_daily >= $${params.length + 1}`;
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      query += ` AND v.price_daily <= $${params.length + 1}`;
      params.push(parseFloat(max_price));
    }

    query += ` GROUP BY p.id, p.name, p.description, p.category, p.vendor_id, u.name, p.created_at`;

    if (availability === 'available') {
      query += ` HAVING SUM(v.stock_quantity) > 0`;
    }

    const sortOptions = {
      relevance: q ? 'p.name ASC' : 'p.created_at DESC',
      price_asc: 'min_price ASC',
      price_desc: 'min_price DESC',
      name_asc: 'p.name ASC',
      name_desc: 'p.name DESC',
      newest: 'p.created_at DESC',
      oldest: 'p.created_at ASC'
    };

    query += ` ORDER BY ${sortOptions[sort] || sortOptions.relevance}`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const productsResult = await db.query(query, params);
    const products = productsResult.rows;

    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      JOIN variants v ON p.id = v.product_id
      WHERE 1=1
    `;
    const countParams = [];

    if (q) {
      countQuery += ` AND (p.name ILIKE $1 OR p.description ILIKE $2 OR p.category ILIKE $3)`;
      const searchTerm = `%${q}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      countQuery += ` AND p.category = $${countParams.length + 1}`;
      countParams.push(category);
    }

    if (min_price || max_price) {
      if (min_price) {
        countQuery += ` AND v.price_daily >= $${countParams.length + 1}`;
        countParams.push(parseFloat(min_price));
      }
      if (max_price) {
        countQuery += ` AND v.price_daily <= $${countParams.length + 1}`;
        countParams.push(parseFloat(max_price));
      }
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};

exports.searchSuggestions = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const query = `
      SELECT DISTINCT p.name
      FROM products p
      WHERE p.name ILIKE $1
      LIMIT $2
    `;

    const result = await db.query(query, [`%${q}%`, parseInt(limit)]);

    res.json({
      success: true,
      suggestions: result.rows.map(r => r.name)
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions'
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM products
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY category ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
};

exports.searchOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const {
      q = '',
      status,
      start_date,
      end_date,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.created_at,
        c.name as customer_name,
        v.name as vendor_name
      FROM orders o
      JOIN users c ON o.customer_id = c.id
      JOIN users v ON o.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (userRole === 'CUSTOMER') {
      query += ` AND o.customer_id = $${params.length + 1}`;
      params.push(userId);
    } else if (userRole === 'VENDOR') {
      query += ` AND o.vendor_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (q) {
      query += ` AND (o.order_number ILIKE $${params.length + 1} OR c.name ILIKE $${params.length + 2})`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      query += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    if (start_date) {
      query += ` AND o.created_at >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND o.created_at <= $${params.length + 1}`;
      params.push(end_date);
    }

    const sortOptions = {
      newest: 'o.created_at DESC',
      oldest: 'o.created_at ASC',
      amount_desc: 'o.total_amount DESC',
      amount_asc: 'o.total_amount ASC'
    };

    query += ` ORDER BY ${sortOptions[sort] || sortOptions.newest}`;

    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const ordersResult = await db.query(query, params);

    res.json({
      success: true,
      data: {
        orders: ordersResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Order search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};
