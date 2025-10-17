import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { ValidationError } from '../utils/errors';

export class NotificationController {

  /**
   * Get user's notifications
   */
  static async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.dbUser.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      console.log('Fetching notifications for userId:', userId);
      const { limit = 50, offset = 0 } = req.query;

      const result = await NotificationService.getUserNotifications(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', (error as Error).message);
      console.error('Error stack:', (error as Error).stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.dbUser.id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message: 'Notification ID is required'
        });
      }

      const success = await NotificationService.markAsRead(parseInt(notificationId), userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or already read'
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.dbUser.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const count = await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${count} notifications marked as read`
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read'
      });
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user?.dbUser.id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message: 'Notification ID is required'
        });
      }

      const success = await NotificationService.deleteNotification(parseInt(notificationId), userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.dbUser.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const count = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count'
      });
    }
  }

  /**
   * Send notification (admin only)
   */
  static async sendNotification(req: Request, res: Response) {
    try {
      const { userId, type, title, message, relatedURL } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'userId, type, title, and message are required'
        });
      }

      const notification = await NotificationService.createNotification({
        userId: parseInt(userId),
        type,
        title,
        message,
        relatedURL
      });

      res.status(201).json({
        success: true,
        data: notification,
        message: 'Notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification'
      });
    }
  }
}