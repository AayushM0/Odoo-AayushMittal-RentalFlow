import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import NotificationBell from '../../components/notifications/NotificationBell';
import * as NotificationContext from '../../contexts/NotificationContext';

describe('NotificationBell', () => {
  const mockNotifications = [
    {
      id: 1,
      title: 'New Order',
      message: 'You have a new order',
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Payment confirmed',
      is_read: false,
      created_at: new Date().toISOString()
    }
  ];

  const mockContextValue = {
    notifications: mockNotifications,
    unreadCount: 2,
    loading: false,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(NotificationContext, 'useNotification').mockReturnValue(mockContextValue);
  });

  it('should render notification bell icon', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display unread count badge', () => {
    render(<NotificationBell />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should not show badge when no unread notifications', () => {
    const contextWithNoUnread = { ...mockContextValue, unreadCount: 0 };
    vi.spyOn(NotificationContext, 'useNotification').mockReturnValue(contextWithNoUnread);
    
    render(<NotificationBell />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should open dropdown when bell is clicked', () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(screen.getByText('New Order')).toBeInTheDocument();
    expect(screen.getByText('Payment Received')).toBeInTheDocument();
  });

  it('should display notification messages', () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('You have a new order')).toBeInTheDocument();
    expect(screen.getByText('Payment confirmed')).toBeInTheDocument();
  });

  it('should call markAsRead when notification is clicked', () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const notification = screen.getByText('New Order');
    fireEvent.click(notification);
    
    expect(mockContextValue.markAsRead).toHaveBeenCalledWith(1);
  });

  it('should show "No notifications" when list is empty', () => {
    const emptyContext = { ...mockContextValue, notifications: [], unreadCount: 0 };
    vi.spyOn(NotificationContext, 'useNotification').mockReturnValue(emptyContext);
    
    render(<NotificationBell />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
  });

  it('should call markAllAsRead when button is clicked', () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const markAllButton = screen.getByText(/Mark all as read/i);
    fireEvent.click(markAllButton);
    
    expect(mockContextValue.markAllAsRead).toHaveBeenCalled();
  });
});
