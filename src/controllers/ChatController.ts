import { Request, Response, NextFunction } from 'express';
import { ChatServices } from '../services/ChatServices';
import { ApiResponseUtil } from '../utils/apiResponse';
import { ValidationError, ItemNotFoundError } from '../utils/errors';
import { WebSocketService } from '../services/WebSocketServices';

export const createDirectChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { counselorId, dbUser } = req.body;
    const userId = dbUser.id;

        if(!counselorId) {
            throw new ValidationError('Target user ID is required');
        }

        const room = await ChatServices.createDirectChat(counselorId, userId);

        ApiResponseUtil.created(res, room, 'Direct chat created successfully');
}

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId, message, messageType, userId } = req.body;

        if(!roomId || !message || !messageType) {
            throw new ValidationError('Room ID, message and message type are required');
        }

        const messageData = await ChatServices.sendMessage({
            roomId,
            senderId: userId,
            message,
            messageType: messageType as 'text' | 'image'
        });

        ApiResponseUtil.success(res, {
            message: messageData
        }, "Message sent successfully");
}

export const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } =  req.params;
    const { limit = 30, offset = 0 } = req.query;
    const userId = req.user!.dbUser.id;

        const result = await ChatServices.getMessages(
            parseInt(roomId),
            userId,
            parseInt(limit as string),
            parseInt(offset as string)
        );

        ApiResponseUtil.success(res, {
            message: result.messages,
            pagination: {
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: result.hasMore
            }
        }, "Messages retrieved successfully");
    }

export const getUnreadMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { roomId } = req.params;
        const userId = req.user!.dbUser.id;

        const messages = await ChatServices.getUnreadMessages(parseInt(roomId), userId);

        ApiResponseUtil.success(res, {
          messages,
          count: messages.length
        }, "Unread messages retrieved successfully");
}

export const getUserRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.dbUser.id;

    if(!userId) {
        throw new ValidationError("User ID is required");
    }

        const rooms = await ChatServices.getUserChatRooms(userId);

        ApiResponseUtil.success(res, {
            rooms
        }, "User chat rooms retrieved successfully");
}

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } = req.params;
    const { messageId } = req.body;
    const userId = req.user!.dbUser.id;

    if (!messageId) {
      throw new ValidationError("Message ID is required");
    }

    await ChatServices.markAsRead(parseInt(roomId), messageId, userId);

    ApiResponseUtil.success(res, {}, "Message marked as read successfully");
}

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } = req.params;
    const userId = req.user!.dbUser.id;

    const count = await ChatServices.getUnreadCount(parseInt(roomId), userId);

    ApiResponseUtil.success(res, {
        count
    }, "Unread count retrieved successfully");
}

export const getRoomDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } = req.params;
    const userId = req.user!.dbUser.id;

    const room = await ChatServices.getUserChatRooms(userId)
        .then(rooms => rooms.find(r => r.id === parseInt(roomId)));

    if (!room) {
        throw new ItemNotFoundError("Chat room not found");
    }

    ApiResponseUtil.success(res, {
        room
    }, "Chat room details retrieved successfully");
}

export const getRoomUnreadMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } = req.params;
    const userId = req.user!.dbUser.id;

    if (!roomId) {
        throw new ValidationError("Room ID is required");
    }

    const getUnreadMessages = await ChatServices.getUnreadMessages(parseInt(roomId), userId);

    if (!getUnreadMessages || getUnreadMessages.length === 0) {
        throw new ItemNotFoundError("No unread messages found in this room");
    }

    ApiResponseUtil.success(res, {
        messages: getUnreadMessages
    }, "Unread messages retrieved successfully");
}

export const testWebSocket = async (req: Request, res: Response) => {
    const { message } = req.body;
    
    await WebSocketService.broadcastTest(message || 'Test message from server');
    
    res.json({ 
        success: true, 
        message: 'WebSocket test message sent' 
    });
};

// export const getRoomReadStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     const { roomId } = req.params;
//     const userId = req.user!.id;

//     const readStatus = await ChatServices.getRoomReadStatus(parseInt(roomId), userId);

//     ApiResponseUtil.success(res, {
//       readStatus
//     }, "Room read status retrieved successfully");
// }
