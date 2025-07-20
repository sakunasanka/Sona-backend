import { Request, Response, NextFunction } from 'express';
import { JWTPayload, JwtServices } from '../services/JwtServices';
import { ValidationError } from '../utils/errors';
import User from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        token: JWTPayload;
        dbUser: {
          id: number;
          firebaseId: string;
          name: string;
          email: string;
          userType: 'Client' | 'Counselor' | 'Admin';
          avatar?: string;
        }
      }
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ValidationError('Authentication token is required');
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    const decoded = await JwtServices.verifyToken(token);
    console.log('✅ Token verified, user ID:', decoded.id);

    const user = await User.findByPk(decoded.id);

    if (!decoded.id || !user) {
      throw new ValidationError('Invalid authentication token');
    }

    req.user = {
      token: decoded,
      dbUser: {
        id: decoded.id,
        firebaseId: decoded.firebaseId,
        name: decoded.name,
        email: decoded.email,
        userType: decoded.userType || 'Client',
        avatar: decoded.avatar || ''
      }
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof ValidationError) {
      res.status(401).json({
        success: false,
        message: error.message,
        error: 'Unauthorized'
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        success: false,
        message: 'An unexpected error occurred during authentication'
      });
    }
  }
}

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'Unauthorized'
      });
      return;
    }

    if (!roles.includes(req.user.dbUser.userType)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'Forbidden'
      });
      return;
    }

    next();
  }
}

// Alias for authenticateToken for more readable code
export const isAuthenticated = authenticateToken;

// Check if user is a counselor
export const isCounselor = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'Unauthorized'
    });
    return;
  }

  if (req.user.dbUser.userType !== 'Counselor') {
    res.status(403).json({
      success: false,
      message: 'Counselor access required',
      error: 'Forbidden'
    });
    return;
  }

  next();
};

// Check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'Unauthorized'
    });
    return;
  }

  if (req.user.dbUser.userType !== 'Admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'Forbidden'
    });
    return;
  }

  next();
};

// Check if user is a client
export const isClient = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'Unauthorized'
    });
    return;
  }

  if (req.user.dbUser.userType !== 'Client') {
    res.status(403).json({
      success: false,
      message: 'Client access required',
      error: 'Forbidden'
    });
    return;
  }

  next();
};
