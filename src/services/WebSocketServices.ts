import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server } from 'http';
import { AuthenticatedSocket, socketAuth, socketRateLimit, socketLogger } from '../middlewares/socket';

export class WebSocketService {
    private static io: SocketIOServer;
    private static userSockets: Map<number, Set<string>> = new Map();

    static initialize(server: Server): void {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.setupMiddleware();
        this.setupEventHandlers();
        
    }

    private static setupMiddleware(): void {
        // Apply middlewares in order
        this.io.use(socketLogger);
        this.io.use(socketAuth);
        this.io.use(socketRateLimit(10, 60000)); // 10 requests per minute
    }

    private static setupEventHandlers(): void {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`User ${socket.userId} connected with socket ID: ${socket.id}`);

            // Add socket to user's socket set
            if(socket.userId) {
                if(!this.userSockets.has(socket.userId)) {
                    this.userSockets.set(socket.userId, new Set());
                }
                this.userSockets.get(socket.userId)?.add(socket.id);
            }

            // Join users chat rooms
            this.joinUserRooms(socket);

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`User ${socket.userId} disconnected: ${reason}`);

                if(socket.userId) {
                    const userSockets = this.userSockets.get(socket.userId);
                    if(userSockets) {
                        userSockets.delete(socket.id);
                        if(userSockets.size === 0) {
                            this.userSockets.delete(socket.userId);
                        }
                    }
                }
            });

           socket.on('typing_stop', async (data: { roomId: number }) => {
                if (await this.canAccessRoom(socket, data.roomId)) {
                    socket.to(`room_${data.roomId}`).emit('user_stopped_typing', {
                        userId: socket.userId
                    });
                }
            });

            // Handle joining specific rooms
            socket.on('join_room', async (data: { roomId: number }) => {
                if (await this.canAccessRoom(socket, data.roomId)) {
                    socket.join(`room_${data.roomId}`);
                    console.log(`User ${socket.userId} joined room ${data.roomId}`);

                    socket.emit('joined_room', { roomId: data.roomId });
                    
                    // Emit to room that user joined
                    socket.to(`room_${data.roomId}`).emit('user_joined_room', {
                        userId: socket.userId,
                        userName: socket.user?.name
                    });
                } else {
                    socket.emit('error', { message: 'Access denied to this room' });
                }
            });

            socket.on('leave_room', async (data: { roomId: number }) => {
                socket.leave(`room_${data.roomId}`);
                console.log(`User ${socket.userId} left room ${data.roomId}`);
                
                socket.emit('left_room', { roomId: data.roomId });
                
                // Emit to room that user left
                socket.to(`room_${data.roomId}`).emit('user_left_room', {
                    userId: socket.userId,
                    userName: socket.user?.name
                });
            });
            
            // Handle message read status
            socket.on('mark_as_read', async (data: { roomId: number, messageId: number }) => {
                if (await this.canAccessRoom(socket, data.roomId)) {
                    try {
                        const { ChatServices } = await import('./ChatServices');
                        await ChatServices.markAsRead(data.roomId, data.messageId, socket.userId!);
                        
                        // Emit read status to other users in the room
                        socket.to(`room_${data.roomId}`).emit('message_read', {
                            userId: socket.userId,
                            messageId: data.messageId,
                            roomId: data.roomId,
                            readAt: new Date()
                        });
                    } catch (error) {
                        console.error('Error marking message as read:', error);
                        socket.emit('error', { message: 'Failed to mark message as read' });
                    }
                }
            });

            // Handle errors
            socket.on('error', (error) => {
                console.error(`Socket error for user ${socket.userId}:`, error);
            });
        })
    }

    private static async joinUserRooms(socket: AuthenticatedSocket): Promise<void> {
        if (!socket.userId) return;

        try {
            // Import here to avoid circular dependency
            const { ChatServices } = await import('./ChatServices');
            const rooms = await ChatServices.getUserChatRooms(socket.userId);
            
            for (const room of rooms) {
                socket.join(`room_${room.id}`);
                console.log(`User ${socket.userId} auto-joined room ${room.id}`);
            }
        } catch (error) {
            console.error('Error joining user rooms:', error);
        }
    }

    private static async canAccessRoom(socket: AuthenticatedSocket, roomId: number): Promise<boolean> {
        if (!socket.userId) return false;

        try {
            const { SocketMiddleware } = await import('../middlewares/socket');
            return await SocketMiddleware.authorizeRoom(socket, roomId);
        } catch (error) {
            console.error('Error checking room access:', error);
            return false;
        }
    }

    // Utility methods for emitting events
    static async emitToRoom(roomId: number, event: string, data: any): Promise<void> {
        if (this.io) {
            this.io.to(`room_${roomId}`).emit(event, data);
        }
    }

    static async emitToUser(userId: number, event: string, data: any): Promise<void> {
        const userSockets = this.userSockets.get(userId);
        
        if (userSockets && this.io) {
            for (const socketId of userSockets) {
                this.io.to(socketId).emit(event, data);
            }
        }
    }

    static async emitToUsers(userIds: number[], event: string, data: any): Promise<void> {
        for (const userId of userIds) {
            await this.emitToUser(userId, event, data);
        }
    }

    static getOnlineUsers(): number[] {
        return Array.from(this.userSockets.keys());
    }

    static isUserOnline(userId: number): boolean {
        return this.userSockets.has(userId);
    }

    static getSocketsForUser(userId: number): Set<string> | undefined {
        return this.userSockets.get(userId);
    }

    static getUserCount(): number {
        return this.userSockets.size;
    }

    static getSocketCount(): number {
        return Array.from(this.userSockets.values()).reduce((total, sockets) => total + sockets.size, 0);
    }

    static async broadcastTest(message: string) {
        console.log('🧪 Broadcasting test message:', message);
        this.io.emit('test_message', { message, timestamp: new Date() });
    }
}