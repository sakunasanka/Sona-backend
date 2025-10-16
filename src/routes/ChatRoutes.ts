import express from 'express';
import { 
    createDirectChat, 
    sendMessage, 
    getMessages, 
    getUnreadMessages, 
    getUserRooms, 
    markAsRead,
    getUnreadCount,
    getRoomDetails,
    getRoomUnreadMessages,
    getChatRoomFromCounselorId
} from '../controllers/ChatController';
import { authenticateToken } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Chat room routes
router.post('/rooms/direct', asyncHandler(createDirectChat));
//use middleare between route and controller
router.get('/rooms/getRoomFromCounselorId/:counselorId', asyncHandler(getChatRoomFromCounselorId));
router.get('/rooms', asyncHandler(getUserRooms));
router.get('/rooms/:roomId', asyncHandler(getRoomDetails));

// Message routes
router.post('/messages', asyncHandler(sendMessage));
router.get('/rooms/:roomId/messages', asyncHandler(getMessages));
router.get('/rooms/:roomId/messages/unread', asyncHandler(getUnreadMessages));
router.get('/rooms/:roomId/unread-count', asyncHandler(getUnreadCount));
router.get('/rooms/:roomId/get-unread', asyncHandler(getRoomUnreadMessages));

// Message status routes
router.patch('/rooms/:roomId/mark-read', asyncHandler(markAsRead));

export default router;

