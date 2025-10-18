import { ValidationError, DatabaseError } from '../utils/errors';
import Notification, { NotificationType } from '../models/Notification';

export interface NotificationData {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedURL?: string;
}

export interface NotificationResponse {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationService {

  /**
   * Create a new notification
   */
  static async createNotification(data: NotificationData): Promise<NotificationResponse> {
    try {
      const notification = await Notification.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedURL: data.relatedURL,
        isRead: false
      });

      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        relatedURL: notification.relatedURL,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      };
    } catch (error) {
      throw new DatabaseError(`Failed to create notification: ${(error as Error).message}`);
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: number, limit: number = 50, offset: number = 0): Promise<{
    notifications: NotificationResponse[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const { count, rows } = await Notification.findAndCountAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const unreadCount = await Notification.count({
        where: { userId, isRead: false }
      });

      const notifications = rows.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        relatedURL: notification.relatedURL,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      }));

      return {
        notifications,
        total: count,
        unreadCount
      };
    } catch (error) {
      throw new DatabaseError(`Failed to fetch notifications: ${(error as Error).message}`);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    try {
      const [affectedRows] = await Notification.update(
        { isRead: true },
        { where: { id: notificationId, userId } }
      );

      return affectedRows > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to mark notification as read: ${(error as Error).message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number): Promise<number> {
    try {
      const [affectedRows] = await Notification.update(
        { isRead: true },
        { where: { userId, isRead: false } }
      );

      return affectedRows;
    } catch (error) {
      throw new DatabaseError(`Failed to mark all notifications as read: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    try {
      const deletedRows = await Notification.destroy({
        where: { id: notificationId, userId }
      });

      return deletedRows > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete notification: ${(error as Error).message}`);
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: number): Promise<number> {
    try {
      return await Notification.count({
        where: { userId, isRead: false }
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get unread count: ${(error as Error).message}`);
    }
  }
}