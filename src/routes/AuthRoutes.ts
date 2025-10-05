import express from 'express';

const router = express.Router();

// Authentication routes
import { signin, signup, resetPassword, getProfile, updateProfile, getUserLoginStats } from '../controllers/AuthController';
import { authenticateToken } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';

// Public routes
router.post('/signup', asyncHandler(signup));
router.post('/signin', asyncHandler(signin));
router.post('/reset-password', asyncHandler(resetPassword));

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/login-stats', authenticateToken, getUserLoginStats);

export default router;