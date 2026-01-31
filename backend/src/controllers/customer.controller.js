const pool = require('../config/database');

exports.getDashboardData = async (req, res) => {
  try {
    const customerId = req.user.id;

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT CASE WHEN o.status IN ('PICKED_UP') THEN o.id END) as active_rentals,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(SUM(CASE WHEN i.status IN ('UNPAID', 'PARTIALLY_PAID') THEN i.total_amount - i.amount_paid ELSE 0 END), 0) as pending_amount,
        COUNT(DISTINCT CASE WHEN i.status IN ('UNPAID', 'PARTIALLY_PAID') THEN i.id END) as pending_invoices
      FROM orders o
      LEFT JOIN invoices i ON o.id = i.order_id
      WHERE o.customer_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [customerId]);
    const statistics = statsResult.rows[0];

    const activeRentalsQuery = `
      SELECT 
        r.id,
        r.start_date,
        r.end_date,
        o.order_number,
        o.status,
        p.name as product_name,
        v.sku
      FROM reservations r
      JOIN orders o ON r.order_id = o.id
      JOIN variants v ON r.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE o.customer_id = $1 AND o.status = 'PICKED_UP'
      ORDER BY r.end_date ASC
      LIMIT 5
    `;

    const activeRentalsResult = await pool.query(activeRentalsQuery, [customerId]);
    const activeRentals = activeRentalsResult.rows;

    const recentOrdersQuery = `
      SELECT 
        id,
        order_number,
        status,
        total_amount,
        created_at
      FROM orders
      WHERE customer_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentOrdersResult = await pool.query(recentOrdersQuery, [customerId]);
    const recentOrders = recentOrdersResult.rows;

    const pendingInvoicesQuery = `
      SELECT 
        i.id,
        i.invoice_number,
        i.status,
        i.total_amount,
        i.amount_paid,
        (i.total_amount - i.amount_paid) as amount_due,
        i.due_date
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      WHERE o.customer_id = $1 AND i.status IN ('UNPAID', 'PARTIALLY_PAID')
      ORDER BY i.due_date ASC
      LIMIT 5
    `;

    const pendingInvoicesResult = await pool.query(pendingInvoicesQuery, [customerId]);
    const pendingInvoices = pendingInvoicesResult.rows;

    res.json({
      success: true,
      data: {
        statistics,
        active_rentals: activeRentals,
        recent_orders: recentOrders,
        pending_invoices: pendingInvoices
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};
