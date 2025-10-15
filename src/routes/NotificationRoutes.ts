import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/notifications
 * @desc Get user's notifications
 * @access Private
 */
router.get('/', NotificationController.getUserNotifications);

/**
 * @route PUT /api/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:notificationId/read', NotificationController.markAsRead);

/**
 * @route PUT /api/notifications/mark-all-read
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/mark-all-read', NotificationController.markAllAsRead);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread-count', NotificationController.getUnreadCount);

/**
 * @route POST /api/notifications/send
 * @desc Send notification (admin only)
 * @access Admin
 */
router.post('/send', NotificationController.sendNotification);

export default router;