import express from 'express';

const router = express.Router();

// Authentication routes
import { signin, signup, resetPassword } from '../controllers/AuthController';
import { authenticateToken } from '../middlewares/auth';

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/reset-password', resetPassword);

// Protected routes
// router.get('/profile', authenticateToken, getProfile);
// router.put('/profile', authenticateToken, updateProfile);

export default router;