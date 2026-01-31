const cron = require('node-cron');
const db = require('../config/database');
const emailService = require('../services/email.service');

cron.schedule('0 9 * * *', async () => {
  console.log('Running email reminder job...');
  
  try {
    const upcomingReturnsQuery = `
      SELECT 
        o.id,
        o.order_number,
        r.end_date,
        u.email,
        u.name,
        EXTRACT(DAY FROM (r.end_date - CURRENT_DATE)) as days_remaining
      FROM orders o
      JOIN reservations r ON o.id = r.order_id
      JOIN users u ON o.customer_id = u.id
      WHERE o.status = 'PICKED_UP'
      AND EXTRACT(DAY FROM (r.end_date - CURRENT_DATE)) = 2
    `;
    
    const upcomingReturns = await db.query(upcomingReturnsQuery);
    
    for (const order of upcomingReturns.rows) {
      await emailService.sendReturnReminderEmail(
        order,
        { name: order.name, email: order.email },
        order.days_remaining
      );
    }
    
    console.log(`Sent ${upcomingReturns.rows.length} return reminder emails`);
  } catch (error) {
    console.error('Email reminder job error:', error);
  }
});

console.log('Email reminder job scheduled (runs daily at 9:00 AM)');
