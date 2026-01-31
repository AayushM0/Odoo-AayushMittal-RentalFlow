const notificationService = require('../services/notification.service');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, unread_only = false } = req.query;
    
    const notifications = await notificationService.getUserNotifications(
      userId,
      parseInt(limit),
      unread_only === 'true'
    );
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await notificationService.markAsRead(id, userId);
    res.json(result);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);
    res.json(result);
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read'
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await notificationService.deleteNotification(id, userId);
    res.json(result);
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

exports.clearAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.clearAllNotifications(userId);
    res.json(result);
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
};
