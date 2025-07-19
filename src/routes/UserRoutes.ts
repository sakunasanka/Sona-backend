import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { 
  checkIsStudent, 
  checkClientIsStudentById, 
  updateClientStudentStatus,
  updateClientStudentStatusById
} from '../controllers/AuthController';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Authentication routes
// router.post('/register', register);
// router.post('/login', login);

// // Protected routes
// router.get('/profile', authenticateToken, getProfile);
// router.put('/profile', authenticateToken, updateProfile);

// Client student status endpoints
router.get('/client/is-student', authenticateToken, asyncHandler(checkIsStudent));
router.put('/client/is-student', authenticateToken, asyncHandler(updateClientStudentStatus));

// Admin routes for client student status
router.get('/admin/client/:clientId/is-student', authenticateToken, asyncHandler(checkClientIsStudentById));
router.put('/admin/client/:clientId/is-student', authenticateToken, asyncHandler(updateClientStudentStatusById));

export default router;