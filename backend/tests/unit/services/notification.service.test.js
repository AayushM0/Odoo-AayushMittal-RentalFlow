const notificationService = require('../../../src/services/notification.service');
const db = require('../../../src/config/database');

jest.mock('../../../src/config/database');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      db.query.mockResolvedValue(mockResult);

      const result = await notificationService.createNotification({
        userId: 1,
        type: 'INFO',
        title: 'Test Notification',
        message: 'Test message',
        relatedType: 'ORDER',
        relatedId: 123
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        expect.arrayContaining([1, 'INFO', 'Test Notification', 'Test message'])
      );
      expect(result.notificationId).toBe(1);
    });

    it('should handle missing optional fields', async () => {
      const mockResult = { rows: [{ id: 2 }] };
      db.query.mockResolvedValue(mockResult);

      await notificationService.createNotification({
        userId: 1,
        type: 'INFO',
        title: 'Test',
        message: 'Message'
      });

      expect(db.query).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      const result = await notificationService.createNotification({
        userId: 1,
        type: 'INFO',
        title: 'Test',
        message: 'Message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { id: 1, title: 'Test 1', is_read: false },
        { id: 2, title: 'Test 2', is_read: true }
      ];
      const mockCount = { rows: [{ count: '2' }] };

      db.query
        .mockResolvedValueOnce({ rows: mockNotifications })
        .mockResolvedValueOnce(mockCount);

      const result = await notificationService.getUserNotifications(1, {
        page: 1,
        limit: 10
      });

      expect(result.notifications).toEqual(mockNotifications);
      expect(result.total).toBe(2);
      expect(result.unread).toBeDefined();
    });

    it('should filter unread notifications', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await notificationService.getUserNotifications(1, {
        unread: true,
        page: 1,
        limit: 10
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('is_read = FALSE'),
        expect.any(Array)
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '5' }] });

      const count = await notificationService.getUnreadCount(1);

      expect(count).toBe(5);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        [1]
      );
    });

    it('should return 0 on error', async () => {
      db.query.mockRejectedValue(new Error('Error'));

      const count = await notificationService.getUnreadCount(1);

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      db.query.mockResolvedValue({ rowCount: 1 });

      const result = await notificationService.markAsRead(1, 1);

      expect(result.success).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        expect.arrayContaining([1, 1])
      );
    });

    it('should handle non-existent notification', async () => {
      db.query.mockResolvedValue({ rowCount: 0 });

      const result = await notificationService.markAsRead(1, 999);

      expect(result.success).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      db.query.mockResolvedValue({ rowCount: 5 });

      const result = await notificationService.markAllAsRead(1);

      expect(result.success).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        [1]
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      db.query.mockResolvedValue({ rowCount: 1 });

      const result = await notificationService.deleteNotification(1, 1);

      expect(result.success).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notifications'),
        [1, 1]
      );
    });
  });
});
