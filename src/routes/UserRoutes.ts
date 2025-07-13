import express from 'express';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Authentication routes
// router.post('/register', register);
// router.post('/login', login);

// // Protected routes
// router.get('/profile', authenticateToken, getProfile);
// router.put('/profile', authenticateToken, updateProfile);

export default router;