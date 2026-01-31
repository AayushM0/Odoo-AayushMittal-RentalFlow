const db = require('../config/database');

exports.getDashboardData = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as new_users_this_month,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as orders_this_month,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as revenue_this_month,
        (SELECT COUNT(*) FROM orders WHERE status = 'PICKED_UP') as active_rentals
    `;
    const statsResult = await db.query(statsQuery);
    const statistics = statsResult.rows[0];

    const userStatsQuery = `
      SELECT 
        COUNT(CASE WHEN role = 'CUSTOMER' THEN 1 END) as customers,
        COUNT(CASE WHEN role = 'VENDOR' THEN 1 END) as vendors,
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins,
        0 as active_today
      FROM users
    `;
    const userStatsResult = await db.query(userStatsQuery);
    const user_statistics = userStatsResult.rows[0];

    const recentActivityQuery = `
      SELECT 
        'order' as type,
        CONCAT('New order #', order_number, ' placed') as description,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const recentActivityResult = await db.query(recentActivityQuery);
    const recent_activity = recentActivityResult.rows;

    const system_health = {
      api_uptime: 99.9,
      storage_used: 45,
      pending_issues: 0
    };

    res.json({
      success: true,
      data: {
        statistics,
        user_statistics,
        recent_activity,
        system_health
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};

exports.getAnalyticsData = async (req, res) => {
  try {
    const { range = '6months' } = req.query;

    const months = range === '1month' ? 1 :
                   range === '3months' ? 3 :
                   range === '6months' ? 6 : 12;

    const revenueTrendQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const revenueTrendResult = await db.query(revenueTrendQuery);
    const revenue_trend = revenueTrendResult.rows;

    const orderVolumeQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const orderVolumeResult = await db.query(orderVolumeQuery);
    const order_volume = orderVolumeResult.rows;

    const userGrowthQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(CASE WHEN role = 'CUSTOMER' THEN 1 END) as customers,
        COUNT(CASE WHEN role = 'VENDOR' THEN 1 END) as vendors
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const userGrowthResult = await db.query(userGrowthQuery);
    const user_growth = userGrowthResult.rows;

    const rentalStatusQuery = `
      SELECT 
        status as name,
        COUNT(*) as value
      FROM orders
      WHERE status IN ('PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'COMPLETED')
      GROUP BY status
    `;
    const rentalStatusResult = await db.query(rentalStatusQuery);
    const rental_status = rentalStatusResult.rows;

    const topProductsQuery = `
      SELECT 
        p.name,
        COALESCE(SUM(o.total_amount), 0) as revenue
      FROM orders o
      JOIN reservations r ON o.id = r.order_id
      JOIN variants v ON r.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE o.created_at >= NOW() - INTERVAL '${months} months'
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const topProductsResult = await db.query(topProductsQuery);
    const top_products = topProductsResult.rows;

    res.json({
      success: true,
      data: {
        revenue_trend,
        order_volume,
        user_growth,
        rental_status,
        top_products
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load analytics data'
    });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;

    if (!type || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Report type, start date, and end date are required'
      });
    }

    let reportData = {};

    switch (type) {
      case 'revenue':
        reportData = await generateRevenueReport(start_date, end_date);
        break;
      case 'orders':
        reportData = await generateOrdersReport(start_date, end_date);
        break;
      case 'rentals':
        reportData = await generateRentalsReport(start_date, end_date);
        break;
      case 'users':
        reportData = await generateUsersReport(start_date, end_date);
        break;
      case 'inventory':
        reportData = await generateInventoryReport(start_date, end_date);
        break;
      case 'payments':
        reportData = await generatePaymentsReport(start_date, end_date);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
};

async function generateRevenueReport(start_date, end_date) {
  const summaryQuery = `
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as average_order_value
    FROM orders
    WHERE created_at BETWEEN $1 AND $2
  `;
  const summaryResult = await db.query(summaryQuery, [start_date, end_date]);

  const dataQuery = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(*) as orders,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM orders
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date DESC
  `;
  const dataResult = await db.query(dataQuery, [start_date, end_date]);

  return {
    title: 'Revenue Report',
    summary: {
      total_orders: summaryResult.rows[0].total_orders,
      total_revenue: `₹${parseFloat(summaryResult.rows[0].total_revenue || 0).toFixed(2)}`,
      average_order_value: `₹${parseFloat(summaryResult.rows[0].average_order_value || 0).toFixed(2)}`
    },
    data: dataResult.rows.map(row => ({
      date: row.date,
      orders: row.orders,
      revenue: `₹${parseFloat(row.revenue).toFixed(2)}`
    }))
  };
}

async function generateOrdersReport(start_date, end_date) {
  const dataQuery = `
    SELECT 
      o.order_number,
      u.name as customer_name,
      o.status,
      o.total_amount,
      TO_CHAR(o.created_at, 'YYYY-MM-DD') as order_date
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    WHERE o.created_at BETWEEN $1 AND $2
    ORDER BY o.created_at DESC
  `;
  const dataResult = await db.query(dataQuery, [start_date, end_date]);

  return {
    title: 'Orders Report',
    summary: {
      total_orders: dataResult.rows.length
    },
    data: dataResult.rows.map(row => ({
      order_number: row.order_number,
      customer: row.customer_name,
      status: row.status,
      amount: `₹${parseFloat(row.total_amount).toFixed(2)}`,
      date: row.order_date
    }))
  };
}

async function generateRentalsReport(start_date, end_date) {
  const dataQuery = `
    SELECT 
      o.order_number,
      p.name as product_name,
      u.name as customer_name,
      TO_CHAR(r.start_date, 'YYYY-MM-DD') as start_date,
      TO_CHAR(r.end_date, 'YYYY-MM-DD') as end_date,
      o.status
    FROM reservations r
    JOIN orders o ON r.order_id = o.id
    JOIN variants v ON r.variant_id = v.id
    JOIN products p ON v.product_id = p.id
    JOIN users u ON o.customer_id = u.id
    WHERE o.created_at BETWEEN $1 AND $2
    ORDER BY r.start_date DESC
  `;
  const dataResult = await db.query(dataQuery, [start_date, end_date]);

  return {
    title: 'Rentals Report',
    summary: {
      total_rentals: dataResult.rows.length
    },
    data: dataResult.rows
  };
}

async function generateUsersReport(start_date, end_date) {
  const dataQuery = `
    SELECT 
      name,
      email,
      role,
      TO_CHAR(created_at, 'YYYY-MM-DD') as joined_date
    FROM users
    WHERE created_at BETWEEN $1 AND $2
    ORDER BY created_at DESC
  `;
  const dataResult = await db.query(dataQuery, [start_date, end_date]);

  return {
    title: 'User Activity Report',
    summary: {
      new_users: dataResult.rows.length,
      customers: dataResult.rows.filter(u => u.role === 'CUSTOMER').length,
      vendors: dataResult.rows.filter(u => u.role === 'VENDOR').length
    },
    data: dataResult.rows
  };
}

async function generateInventoryReport(start_date, end_date) {
  const dataQuery = `
    SELECT 
      p.name as product_name,
      v.sku,
      v.stock_quantity as total_stock,
      (v.stock_quantity - COALESCE(SUM(CASE 
        WHEN o.status IN ('CONFIRMED', 'PICKED_UP') THEN r.quantity ELSE 0 END), 0)) as available_stock,
      COALESCE(SUM(CASE WHEN o.status IN ('CONFIRMED', 'PICKED_UP') THEN r.quantity ELSE 0 END), 0) as rented
    FROM variants v
    JOIN products p ON v.product_id = p.id
    LEFT JOIN reservations r ON v.id = r.variant_id
    LEFT JOIN orders o ON r.order_id = o.id
    GROUP BY v.id, p.name, v.sku, v.stock_quantity
    ORDER BY p.name
  `;
  const dataResult = await db.query(dataQuery);

  return {
    title: 'Inventory Report',
    summary: {
      total_products: dataResult.rows.length
    },
    data: dataResult.rows
  };
}

async function generatePaymentsReport(start_date, end_date) {
  const dataQuery = `
    SELECT 
      p.transaction_id,
      o.order_number,
      u.name as customer_name,
      p.amount,
      p.status,
      TO_CHAR(p.created_at, 'YYYY-MM-DD') as payment_date
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    JOIN users u ON o.customer_id = u.id
    WHERE p.created_at BETWEEN $1 AND $2
    ORDER BY p.created_at DESC
  `;
  const dataResult = await db.query(dataQuery, [start_date, end_date]);

  return {
    title: 'Payments Report',
    summary: {
      total_payments: dataResult.rows.length,
      successful: dataResult.rows.filter(p => p.status === 'SUCCESS').length,
      total_amount: `₹${dataResult.rows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}`
    },
    data: dataResult.rows.map(row => ({
      transaction_id: row.transaction_id,
      order_number: row.order_number,
      customer: row.customer_name,
      amount: `₹${parseFloat(row.amount).toFixed(2)}`,
      status: row.status,
      date: row.payment_date
    }))
  };
}
