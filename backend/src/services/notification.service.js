const db = require('../config/database');

async function createNotification({ userId, type = 'INFO', title, message, link = null }) {
  try {
    const result = await db.query(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, type, title, message, link]
    );
    return { success: true, notificationId: result.rows[0].id };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
}

async function getUserNotifications(userId, limit = 50, unreadOnly = false) {
  try {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    
    if (unreadOnly) {
      query += ' AND is_read = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(limit);
    
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
}

async function getUnreadCount(userId) {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
}

async function markAsRead(notificationId, userId) {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    return { success: true };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { success: false, error: error.message };
  }
}

async function markAllAsRead(userId) {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return { success: true };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { success: false, error: error.message };
  }
}

async function deleteNotification(notificationId, userId) {
  try {
    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    return { success: true };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { success: false, error: error.message };
  }
}

async function clearAllNotifications(userId) {
  try {
    await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    return { success: true };
  } catch (error) {
    console.error('Clear notifications error:', error);
    return { success: false, error: error.message };
  }
}

const NotificationTemplates = {
  ORDER_CONFIRMED: (orderNumber) => ({
    type: 'SUCCESS',
    title: 'Order Confirmed',
    message: `Your order #${orderNumber} has been confirmed successfully.`,
    link: `/orders/${orderNumber}`
  }),
  
  PAYMENT_SUCCESS: (amount, orderNumber) => ({
    type: 'SUCCESS',
    title: 'Payment Successful',
    message: `Payment of ₹${amount} for order #${orderNumber} received.`,
    link: `/orders/${orderNumber}`
  }),
  
  PICKUP_READY: (orderNumber) => ({
    type: 'INFO',
    title: 'Ready for Pickup',
    message: `Your order #${orderNumber} is ready for pickup.`,
    link: `/orders/${orderNumber}`
  }),
  
  RETURN_DUE_SOON: (orderNumber, days) => ({
    type: 'WARNING',
    title: 'Return Reminder',
    message: `Order #${orderNumber} is due for return in ${days} day(s).`,
    link: `/orders/${orderNumber}`
  }),
  
  RETURN_OVERDUE: (orderNumber) => ({
    type: 'ERROR',
    title: 'Return Overdue',
    message: `Order #${orderNumber} is overdue. Please return immediately to avoid late fees.`,
    link: `/orders/${orderNumber}`
  }),
  
  QUOTATION_APPROVED: (quotationId) => ({
    type: 'SUCCESS',
    title: 'Quotation Approved',
    message: `Your quotation #${quotationId} has been approved.`,
    link: `/quotations/${quotationId}`
  }),
  
  QUOTATION_REJECTED: (quotationId) => ({
    type: 'ERROR',
    title: 'Quotation Rejected',
    message: `Your quotation #${quotationId} has been rejected.`,
    link: `/quotations/${quotationId}`
  })
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  NotificationTemplates
};
