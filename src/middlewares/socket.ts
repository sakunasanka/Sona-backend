import { Socket } from 'socket.io';
import { adminAuth } from '../config/firebase';
import { UserService } from '../services/UserSerives';
import { ItemNotFoundError, ValidationError } from '../utils/errors';
import { JwtServices } from '../services/JwtServices';

export interface AuthenticatedSocket extends Socket {
    userId?: number;
    user?: any;
}

export class SocketMiddleware {
    /**
     * Authentication middleware for Socket.IO
     * Verifies Firebase token and attaches user info to socket
     */
    static async authenticate(socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> {
        try {
            const token = socket.handshake.query.token as string;
            
            if (!token) {
                console.log('Socket connection rejected: No token provided');
                return next(new Error('Authentication token required'));
            }

            // Verify Firebase token
            const decodedToken = await JwtServices.verifyToken(token);
            
            if (!decodedToken) {
                console.log('Socket connection rejected: Invalid token');
                return next(new ValidationError('Invalid authentication token'));
            }

            // Get user from database
            const user = await UserService.getUserByFirebaseId(decodedToken.firebaseId);
            
            if (!user) {
                console.log('Socket connection rejected: User not found for Firebase ID:', decodedToken.firebaseId);
                return next(new ItemNotFoundError('User not found'));
            }

            // Attach user info to socket
            socket.userId = user.id;
            socket.user = user;
            
            console.log(`Socket authenticated: User ${user.id} (${user.name})`);
            next();
        } catch (error: any) {
            console.error('Socket authentication error:', error);
            
            // Provide specific error messages for different error types
            if (error.code === 'auth/id-token-expired') {
                return next(new Error('Authentication token expired'));
            } else if (error.code === 'auth/invalid-id-token') {
                return next(new Error('Invalid authentication token'));
            } else {
                return next(new Error('Authentication failed'));
            }
        }
    }

    /**
     * Authorization middleware to check if user can access a specific room
     */
    static async authorizeRoom(socket: AuthenticatedSocket, roomId: number): Promise<boolean> {
        try {
            if (!socket.userId) {
                return false;
            }

            // Import here to avoid circular dependency
            const ChatService = await import('../services/ChatServices');
            const canAccess = await ChatService.ChatServices.isUserInRoom(roomId, socket.userId);

            return canAccess;
        } catch (error) {
            console.error('Room authorization error:', error);
            return false;
        }
    }

    /**
     * Rate limiting middleware to prevent spam
     */
    static rateLimiter(maxRequests: number = 10, windowMs: number = 60000) {
        const userRequests = new Map<number, { count: number; resetTime: number }>();

        return (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
            if (!socket.userId) {
                return next(new Error('User not authenticated'));
            }

            const now = Date.now();
            const userLimit = userRequests.get(socket.userId);

            if (!userLimit || now > userLimit.resetTime) {
                // Reset or initialize user's rate limit
                userRequests.set(socket.userId, {
                    count: 1,
                    resetTime: now + windowMs
                });
                return next();
            }

            if (userLimit.count >= maxRequests) {
                return next(new Error('Rate limit exceeded'));
            }

            userLimit.count++;
            next();
        };
    }

    /**
     * Logging middleware for debugging
     */
    static logger(socket: AuthenticatedSocket, next: (err?: Error) => void): void {
        console.log(`Socket ${socket.id} from user ${socket.userId} attempting connection`);
        next();
    }
}

export const requireRoomAccess = (eventName: string) => {
    return async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
        // This would be used for specific events that require room access
        // You can implement custom logic here
        next();
    };
};

/**
 * Middleware function factory for easy use
 */
export const socketAuth = SocketMiddleware.authenticate;
export const socketRateLimit = SocketMiddleware.rateLimiter;
export const socketLogger = SocketMiddleware.logger;