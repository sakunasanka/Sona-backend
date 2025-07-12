import { DataTypes, Model, QueryTypes, Op } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { DbHelpers } from '../helpers/dbHelpers';
import ChatRoom from './ChatRoom';

export interface ChatMessageAttributes {
    id: number;
    roomId: number;
    senderId: number;
    message: string;
    messageType: 'text' | 'image';
    createdAt: Date;
    updatedAt: Date;
}

class ChatMessage extends Model<ChatMessageAttributes> implements ChatMessageAttributes {
    public id!: number;
    public roomId!: number;
    public senderId!: number;
    public message!: string;
    public messageType!: 'text' | 'image';
    public createdAt!: Date;
    public updatedAt!: Date;

    static async createMessage(data: {
        roomId: number;
        senderId: number;
        message: string;
        messageType: 'text' | 'image';
    }): Promise<ChatMessage> {
        const message = await DbHelpers.insert({
            tableName: 'chat_messages',
            columns: ['roomId', 'senderId', 'message', 'messageType'],
            values: [data.roomId, data.senderId, data.message, data.messageType],
            returning: ['id', 'roomId', 'senderId', 'message', 'messageType', 'createdAt']
        });

        const chatMessage = new ChatMessage();
        chatMessage.id = message[0].id;
        chatMessage.roomId = message[0].room_id;
        chatMessage.senderId = message[0].sender_id;
        chatMessage.message = message[0].message;
        chatMessage.messageType = message[0].message_type;
        chatMessage.createdAt = message[0].created_at;
        chatMessage.updatedAt = message[0].updated_at;

       return chatMessage;
    }

    static async getMessagesPaginated(
        roomId: number,
        limit: number = 30,
        offset: number = 0
    ): Promise<{messages: any[], hasMore: boolean}> {
        const messages = await sequelize.query(`
            SELECT 
                cm.id,
                cm."roomId",
                cm."senderId",
                cm.message,
                cm."messageType",
                cm."createdAt"
            FROM chat_messages cm
            WHERE cm."roomId" = ?
            ORDER BY cm."createdAt" DESC
            LIMIT ? OFFSET ?
        `, {
            replacements: [roomId, limit + 1, offset],
            type: QueryTypes.SELECT
        });

            const hasMore = messages.length > limit;
            if (hasMore) messages.pop();

            return {
                 messages: messages.reverse(), 
                 hasMore 
            };
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            throw new Error('Error fetching messages');
    }

    static async getUnreadMessages(roomId: number, userId: number): Promise<any []> {
        const messages = await sequelize.query(`
            SELECT 
                cm.id,
                cm."roomId",
                cm."senderId",
                cm.message,
                cm."messageType",
                cm."createdAt",
                u.name as senderName,
                u.avatar as senderAvatar,
                u."userType" as senderType
            FROM "chat_messages" cm
            JOIN users u ON cm."senderId" = u.id
            LEFT JOIN user_last_read ulr ON ulr."userId" = ? 
            AND ulr."roomId" = cm."roomId"
            WHERE cm."roomId" = ?
            AND cm."senderId" != ?
            AND (ulr."lastMessageId" IS NULL OR cm.id > ulr."lastMessageId")
            ORDER BY cm."createdAt" ASC
             `, {
                replacements: [userId, roomId, userId],
                type: QueryTypes.SELECT
            });
        return messages;
    }

    static async getUnreadCount(roomId: number, userId: number): Promise<number> {
        const result = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM chat_messages cm
            LEFT JOIN user_last_read ulr ON ulr."userId" =? AND ulr."roomId" = cm."roomId"
            WHERE cm."roomId" = ?
            AND cm."senderId" != ?
            AND (ulr."lastMessageId" IS NULL OR cm.id > ulr."lastMessageId")
        `, {
            replacements: [userId, roomId, userId],
            type: QueryTypes.SELECT
        });
        return parseInt((result[0] as any).count) || 0;
    }

    static async markAsRead(roomId: number, userId: number, messageId: number): Promise<void> {
        await sequelize.query(`
            INSERT INTO "user_last_read" ("userId", "roomId", "lastMessageId", "readAt")
            VALUES (?, ?, ?, NOW())
            ON CONFLICT ("userId", "roomId")
            DO UPDATE SET
                "lastMessageId" = EXCLUDED."lastMessageId",
                "readAt" = EXCLUDED."readAt"
            WHERE "user_last_read"."lastMessageId" < EXCLUDED."lastMessageId"
            OR "user_last_read"."lastMessageId" IS NULL
        `, {
            replacements: [userId, roomId, messageId],
        });
    }

    static async getMessageWithDetails(messageId: number): Promise<any> {
        const result = await sequelize.query(`
            SELECT
                cm.id,
                cm."roomId",
                cm."senderId",
                cm.message,
                cm."messageType",
                cm."createdAt",
                u.name as "senderName",
                u.avatar as "senderAvatar",
                u."userType" as "senderType"
            FROM "chat_messages" cm
            JOIN users u ON cm."senderId" = u.id
            WHERE cm.id = ?
        `, {
            replacements: [messageId],
            type: QueryTypes.SELECT
        });
        return result[0] || null;
    }
}

ChatMessage.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ChatRoom,
            key: 'id',
        },
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    messageType: {
        type: DataTypes.ENUM('text', 'image'),
        defaultValue: 'text',
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    sequelize,
    tableName: 'chat_messages',
    modelName: 'ChatMessage',
});

export default ChatMessage;

ChatMessage.belongsTo(User, {
    foreignKey: 'senderId',
    targetKey: 'id',
    as: 'sender'
});

ChatMessage.belongsTo(ChatRoom, {
    foreignKey: 'roomId',
    targetKey: 'id',
    as: 'room'
});

User.hasMany(ChatMessage, {
    foreignKey: 'senderId',
    sourceKey: 'id',
    as: 'messages'
});

ChatRoom.hasMany(ChatMessage, {
    foreignKey: 'roomId',
    sourceKey: 'id',
    as: 'messages'
});