const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.get('/', authenticate, notificationController.getNotifications);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);
router.delete('/', authenticate, notificationController.clearAll);

module.exports = router;
