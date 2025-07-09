import jwt from 'jsonwebtoken';
import { adminAuth } from '../config/firebase';
import { UserService } from './UserSerives';
import { InternalServerError, ItemNotFoundError, ValidationError } from '../utils/errors';

export interface JWTPayload {
    firebaseId: string;
    email: string;

    //user details
    id: number;
    name: string;
    userType: 'Client' | 'Counselor' | 'Admin';
    avatar?: string;

    // JWT specific
    iat?: number; // issued at time
    exp?: number; // expiration time
    iss: string; // issuer
    sub: string; // subject
}

export class JwtServices {
    private static readonly JWT_SECRET = process.env.JWT_SECRET;
    private static readonly ISSUER = 'sona-backend';
    private static readonly EXPIRATION_TIME = '7d'; // 7 days

    //firebase token verification
    public static async issueToken(firebaseToken: string): Promise<{
        token: string;
        user: any;
        expiresIn: number;
    }> {
        try {
            const decodedToken = await adminAuth.verifyIdToken(firebaseToken);

            const user = await UserService.getUserByFirebaseId(decodedToken.uid);

            if(!user) {
                throw new ItemNotFoundError('User not found for the provided Firebase ID');
            }

            const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
                //firebase data
                firebaseId: decodedToken.uid,
                email: user.email,

                //user details
                id: user.id,
                name: user.name,
                userType: user.userType,
                avatar: user.avatar,

                //jwt claims
                iss: JwtServices.ISSUER,
                sub: `user-${user.id}`
            };

            // sign the JWT token
            const token = jwt.sign(payload, JwtServices.JWT_SECRET!, {
                expiresIn: JwtServices.EXPIRATION_TIME,
            });

            return {
                token,
                user,
                expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
            };
        } catch (error) {
            console.error('Error issuing JWT token:', error);
            throw new Error('Failed to issue JWT token');
        }
    }

    static async verifyToken(token: string): Promise<JWTPayload> {
        if (!JwtServices.JWT_SECRET) {
            throw new InternalServerError('JWT secret is not configured');
        }

        try {
            const decoded = jwt.verify(token, JwtServices.JWT_SECRET) as JWTPayload;

            // Validate issuer and subject
            if (decoded.iss !== JwtServices.ISSUER) {
                throw new ValidationError('Invalid token issuer');
            }

            return decoded;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new ValidationError('Invalid authentication token');
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new ValidationError('Authentication token has expired');
            }
            throw error;
        }
    }

    //issue new token for user
    static async refreshToken(currentToken: string): Promise<{ token: string; expiresIn: number }> {
        try {
            const decoded = await JwtServices.verifyToken(currentToken);

            if (!decoded || !decoded.firebaseId) {
                throw new ValidationError('Invalid token structure');
            }

            const user = await UserService.getUserByFirebaseId(decoded.firebaseId);

            if(!user) {
                throw new ItemNotFoundError('User not found for the provided Firebase ID');
            }

            // Create a new token with the same payload
            // Issue new token with fresh data
            const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
              firebaseId: decoded.firebaseId,
              email: user.email,
              id: user.id,
              name: user.name,
              userType: user.userType,
              avatar: user.avatar,
              iss: JwtServices.ISSUER,
              sub: user.id.toString(),
            };

            const newToken = jwt.sign(payload, JwtServices.JWT_SECRET!, {
                expiresIn: JwtServices.EXPIRATION_TIME,
                issuer: JwtServices.ISSUER,
            });

            return {
                token: newToken,
                expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
            };
        } catch (error) {
            console.error('Error refreshing JWT token:', error);
            throw new InternalServerError('Failed to refresh JWT token');
        }
    }

     /**
    * Get token expiration time in seconds
    */
    private static getExpirationTime(): number {
        const expiresInMs = this.parseExpiresIn(this.EXPIRATION_TIME);
        return Math.floor(Date.now() / 1000) + Math.floor(expiresInMs / 1000);
      }

      private static parseExpiresIn(expiresIn: string): number {
      const match = expiresIn.match(/^(\d+)([smhd])$/);
      if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

        const [, amount, unit] = match;
        const num = parseInt(amount, 10);

        switch (unit) {
            case 's': return num * 1000;
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            case 'd': return num * 24 * 60 * 60 * 1000;
            default: return 7 * 24 * 60 * 60 * 1000;
        }
    }

      /**
     * Decode token without verification (for debugging)
     */
    static decodeToken(token: string): JWTPayload | null {
      try {
        return jwt.decode(token) as JWTPayload;
      } catch {
        return null;
      }
    }
}

