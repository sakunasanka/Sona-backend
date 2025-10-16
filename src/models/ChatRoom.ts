import { DataTypes, Model, QueryTypes, Op } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { DbHelpers } from '../helpers/dbHelpers';
import { DatabaseError } from '../utils/errors';

export interface ChatRoomAttributes {
    id: number;
    name?: string;
    type: 'direct' | 'global';
    counselorId?: number;
    clientId?: number;
    createdAt: Date;
    updatedAt: Date;
}

class ChatRoom extends Model<ChatRoomAttributes> implements ChatRoomAttributes {
    public id!: number;
    public name?: string;
    public type!: 'direct' | 'global';
    public counselorId?: number;
    public clientId?: number;
    public createdAt!: Date;
    public updatedAt!: Date;

    // Global chat room ID is always 1
    static readonly GLOBAL_CHAT_ROOM_ID = 1;

    static async createDirectChat(counselorId: number, clientId: number): Promise<ChatRoom> {
        const transaction = await sequelize.transaction();

        try {
            //check if the direct chat room already exists
            const existingRoom = await sequelize.query<{ id: number }>(`
                SELECT id FROM chat_rooms
                WHERE type = 'direct'
                AND "counselorId" = ?
                AND "clientId" = ?
            `, {
                replacements: [counselorId, clientId],
                type: QueryTypes.SELECT,
                transaction
            });

            if(existingRoom.length > 0) {
                await transaction.rollback();
                const foundRoom = await ChatRoom.findByPk(existingRoom[0].id);
                if (!foundRoom) {
                    await transaction.rollback();
                    throw new Error('ChatRoom not found');
                }
                return foundRoom;
            }

            //Create new direct chat 
            const newRoom = await DbHelpers.insert({
                tableName: 'chat_rooms',
                columns: ['type', "counselorId", "clientId"],
                values: ['direct', counselorId, clientId],
                transaction,
                returning: ['id', 'type', "counselorId", 'clientId']
            })

            await transaction.commit();

            const chatRoom = new ChatRoom();
            chatRoom.id = newRoom[0].id;
            chatRoom.type = newRoom[0].type;
            chatRoom.counselorId = newRoom[0].counselorId
            chatRoom.clientId = newRoom[0].clientId;
            chatRoom.createdAt = newRoom[0].createdAt;
            chatRoom.updatedAt = newRoom[0].updatedAt;

            return chatRoom;
        }catch(error) {
            await transaction.rollback();
            throw new DatabaseError(`Failed to create direct chat room ,` + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    //to get a users all chat rooms alongside with chat messages and unread count
   // models/ChatRoom.ts
static async getUserChatRooms(userId: number): Promise<any[]> {
    try {
        console.log('Getting chat rooms for userId:', userId);
        
        // Get user data to determine role
        const userData = await User.findByPk(userId);
        const isCounselor = userData?.role === 'Counselor';
        
        const rooms = await sequelize.query<any>(`
            SELECT 
                cr.id,
                cr.name,
                cr.type,
                cr."counselorId",
                cr."clientId",
                cr."createdAt",
                CASE 
                    WHEN cr.type = 'global' THEN 'Global Chat'
                    WHEN cr."counselorId" = $1 THEN (
                        SELECT 
                            CASE 
                                WHEN u.role = 'Client' AND c."nickName" IS NOT NULL THEN c."nickName"
                                ELSE u.name
                            END
                        FROM users u
                        LEFT JOIN clients c ON u.id = c."userId" AND u.role = 'Client'
                        WHERE u.id = cr."clientId"
                    )
                    ELSE (
                        SELECT name FROM users WHERE id = cr."counselorId"
                    )
                END as "otherUserName",
                CASE 
                    WHEN cr.type = 'global' THEN NULL
                    WHEN cr."counselorId" = $2 THEN (
                        SELECT avatar FROM users WHERE id = cr."clientId"
                    )
                    ELSE (
                        SELECT avatar FROM users WHERE id = cr."counselorId"
                    )
                END as "otherUserAvatar",
                (SELECT message FROM "chat_messages" WHERE "roomId" = cr.id ORDER BY "createdAt" DESC LIMIT 1) as last_message,
                (SELECT "createdAt" FROM "chat_messages" WHERE "roomId" = cr.id ORDER BY "createdAt" DESC LIMIT 1) as last_message_time,
                COALESCE((
                    SELECT COUNT(*)
                    FROM "chat_messages" cm
                    LEFT JOIN "user_last_read" ulr ON ulr."userId" = $3 AND ulr."roomId" = cr.id
                    WHERE cm."roomId" = cr.id 
                    AND cm."senderId" != $4
                    AND (ulr."lastMessageId" IS NULL OR cm.id > ulr."lastMessageId")
                ), 0) as unread_count
            FROM "chat_rooms" cr
            WHERE ${isCounselor ? "cr.type = 'direct' AND" : "cr.type = 'global' OR"} 
            (cr."counselorId" = $5 OR cr."clientId" = $6)
            ORDER BY last_message_time DESC NULLS LAST
        `, {
            bind: [userId, userId, userId, userId, userId, userId],
            type: QueryTypes.SELECT
        }) as any[];

        // Transform the response based on user role
        const transformedRooms = rooms.map(room => {
            const result: any = {
                id: room.id,
                name: room.name,
                type: room.type,
                counselorId: room.counselorId,
                clientId: room.clientId,
                createdAt: room.createdAt,
                last_message: room.last_message,
                last_message_time: room.last_message_time,
                unread_count: room.unread_count
            };

            // For counselors, use "clientName", for clients use "counselorName"
            if (isCounselor) {
                result.clientName = room.otherUserName;
                result.clientAvatar = room.otherUserAvatar;
            } else {
                result.counselorName = room.otherUserName;
                result.counselorAvatar = room.otherUserAvatar;
            }

            return result;
        });

        console.log(`Found ${transformedRooms.length} rooms for user ${userId}`);
        return transformedRooms;
    } catch (error) {
        console.error('Error in getUserChatRooms:', error);
        throw new DatabaseError(error instanceof Error ? error.message : 'Unknown error');
    }
}

    static async getChatRoom(roomId: number): Promise<ChatRoom | null> {
        const room = await ChatRoom.findByPk(roomId);
        return room;
    }

    static async isUserInRoom(roomId: number, userId: number): Promise<boolean> {
        if (roomId === ChatRoom.GLOBAL_CHAT_ROOM_ID) {
            return true; // All users are in the global chat room
        }

        const result = await ChatRoom.findOne({
            where: {
                id: roomId,
                [Op.or]: [
                    { counselorId: userId },
                    { clientId: userId }
                ] as any // Type assertion to satisfy TypeScript
            }
        })

        return !!result;
    }
}

// Initialize models
ChatRoom.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM('direct', 'global'),
        allowNull: false,
    },
    counselorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id',
        },
    },
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id',
        },
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
    },
}, {
    sequelize,
    tableName: 'chat_rooms',
    modelName: 'ChatRoom',
});

export default ChatRoom;