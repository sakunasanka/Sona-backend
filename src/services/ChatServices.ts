import ChatRoom from "../models/ChatRoom";
import ChatMessage from "../models/ChatMessage";
import { AuthenticationError } from "../utils/errors";
import { WebSocketService } from "./WebSocketServices";
import { UserService } from "./UserSerives";

export class ChatServices {
    static async createDirectChat(counselorId: number, clientId: number): Promise<ChatRoom> {
        return await ChatRoom.createDirectChat(counselorId, clientId);
    }

    static async sendMessage(data : {
        roomId: number;
        senderId: number;
        message: string;
        messageType: 'text' | 'image';
    }): Promise<any> {
        //1 is global chat
        if(data.roomId != 1){
            const canAccess = await ChatRoom.isUserInRoom(data.roomId, data.senderId);
        if(!canAccess) {
            throw new AuthenticationError('You do not have access to this chat room');
        }
        }

        // Create the message
        const message = await ChatMessage.createMessage(data);

        // Get message with sender details
        const messageWithDetails = await ChatMessage.getMessageWithDetails(message.id);

        // Emit the message to the room
        await WebSocketService.emitToRoom(data.roomId, 'new_message', {
            message: messageWithDetails,
        });

        return messageWithDetails;
    }

    static async getMessages(roomId: number, userId: number, limit: number = 30, offset: number = 0): Promise<{ messages: any[], hasMore: boolean }> {
        const canAccess = await ChatRoom.isUserInRoom(roomId, userId);
        if(!canAccess) {
            throw new AuthenticationError('You do not have access to this chat room');
        }

        return await ChatMessage.getMessagesPaginated(roomId, limit, offset);
    }

    static async markAsRead(roomId: number, messageId: number, userId: number) {
        const canAccess = await ChatRoom.isUserInRoom(roomId, userId);
        if(!canAccess) {
            throw new AuthenticationError('You do not have access to this chat room');
        }

        // Emit read status to the room
        // need to implement

        await ChatMessage.markAsRead(roomId, userId, messageId);

        // Get updated unread count for the user
        const unreadCount = await ChatMessage.getUnreadCount(roomId, userId);

        // Get user display name for the read receipt (nickname for clients)
        const displayName = await UserService.getUserDisplayName(userId);

        // Get user details for avatar
        const user = await UserService.getUserDetails(userId);
        if (!user) {
            throw new AuthenticationError('User not found');
        }

        // Emit read status to all users in the room
        await WebSocketService.emitToRoom(roomId, 'message_read', {
            roomId: roomId,
            messageId: messageId,
            readBy: {
                id: userId,
                name: displayName,
                avatar: user?.avatar || null
            },
            unreadCount: unreadCount,
            readAt: new Date()
        });

        // Also emit updated unread count specifically to the reader
        await WebSocketService.emitToUser(userId, 'unread_count_updated', {
            roomId: roomId,
            unreadCount: unreadCount
        });

        return {
            success: true,
            unreadCount: unreadCount,
            markedAt: new Date()
        };
    }

    static async getUserChatRooms(userId: number) {
        return await ChatRoom.getUserChatRooms(userId);
    }

    static async getUnreadCount(roomId: number, userId: number) {
        const canAccess = await ChatRoom.isUserInRoom(roomId, userId);
        if(!canAccess) {
            throw new AuthenticationError('You do not have access to this chat room');
        }

        return await ChatMessage.getUnreadCount(roomId, userId);
    }

    static async getUnreadMessages(roomId: number, userId: number): Promise<any []> {
        const canAccess = await ChatRoom.isUserInRoom(roomId, userId);
        if(!canAccess) {
            throw new AuthenticationError('You do not have access to this chat room');
        }

        return await ChatMessage.getUnreadMessages(roomId, userId);
    }

    static async isUserInRoom(roomId: number, userId: number): Promise<boolean> {
        return await ChatRoom.isUserInRoom(roomId, userId);
    }

    static async getChatRoomFromCounselorId(counselorId: number, clientId: number): Promise<ChatRoom | null> {
        return await ChatRoom.findOne({
            where: {
                counselorId,
                clientId
            }
        });
    }
}
