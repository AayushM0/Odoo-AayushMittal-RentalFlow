const pool = require('../config/database');

exports.getDashboardData = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const statsQuery = `
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE 
          WHEN EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
          AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE) 
          THEN o.total_amount ELSE 0 END), 0) as monthly_revenue,
        COUNT(DISTINCT CASE 
          WHEN EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
          AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE) 
          THEN o.id END) as monthly_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'PICKED_UP' THEN o.id END) as active_rentals,
        COALESCE(SUM(CASE 
          WHEN i.status IN ('UNPAID', 'PARTIALLY_PAID') 
          THEN i.total_amount - i.amount_paid ELSE 0 END), 0) as outstanding_amount
      FROM orders o
      LEFT JOIN invoices i ON o.id = i.order_id
      WHERE o.vendor_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [vendorId]);
    const statistics = statsResult.rows[0];

    const pendingActionsQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN o.status = 'CONFIRMED' THEN o.id END) as pending_pickups,
        COUNT(DISTINCT CASE WHEN o.status = 'PICKED_UP' THEN o.id END) as pending_returns,
        (SELECT COUNT(*) FROM quotations WHERE vendor_id = $1 AND status = 'PENDING') as pending_quotations
      FROM orders o
      WHERE o.vendor_id = $1
    `;
    
    const pendingActionsResult = await pool.query(pendingActionsQuery, [vendorId]);
    const pending_actions = pendingActionsResult.rows[0];

    const activeRentalsQuery = `
      SELECT 
        r.id,
        r.start_date,
        r.end_date,
        o.id as order_id,
        o.order_number,
        o.status,
        p.name as product_name,
        v.sku,
        u.name as customer_name
      FROM reservations r
      JOIN orders o ON r.order_id = o.id
      JOIN variants v ON r.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN users u ON o.customer_id = u.id
      WHERE o.vendor_id = $1 AND o.status = 'PICKED_UP'
      ORDER BY r.end_date ASC
      LIMIT 10
    `;
    
    const activeRentalsResult = await pool.query(activeRentalsQuery, [vendorId]);
    const activeRentals = activeRentalsResult.rows;

    const inventoryQuery = `
      SELECT 
        v.id,
        p.name as product_name,
        v.sku,
        v.stock_quantity as total_stock,
        (v.stock_quantity - COALESCE(SUM(CASE 
          WHEN o.status IN ('CONFIRMED', 'PICKED_UP') THEN r.quantity ELSE 0 END), 0)) as available_stock
      FROM variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN reservations r ON v.id = r.variant_id
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE p.vendor_id = $1
      GROUP BY v.id, p.name, v.sku, v.stock_quantity
      ORDER BY available_stock ASC
      LIMIT 10
    `;
    
    const inventoryResult = await pool.query(inventoryQuery, [vendorId]);
    const inventoryStatus = inventoryResult.rows;

    const recentOrdersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.created_at,
        u.name as customer_name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.vendor_id = $1
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
    
    const recentOrdersResult = await pool.query(recentOrdersQuery, [vendorId]);
    const recentOrders = recentOrdersResult.rows;

    res.json({
      success: true,
      data: {
        statistics,
        pending_actions,
        active_rentals: activeRentals,
        inventory_status: inventoryStatus,
        recent_orders: recentOrders
      }
    });
  } catch (error) {
    console.error('Vendor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: error.message
    });
  }
};
