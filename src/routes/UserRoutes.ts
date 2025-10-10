import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { 
  checkIsStudent, 
  checkClientIsStudentById, 
  updateClientStudentStatus,
  updateClientStudentStatusById
} from '../controllers/AuthController';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserDailyMoods, createUserDailyMood } from '../controllers/DailyMoodController';
import { isAdmin } from '../middlewares/auth';

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

// Daily moods
router.get('/:id/moods', authenticateToken, getUserDailyMoods);
router.get('/admin/:id/moods', authenticateToken, isAdmin, getUserDailyMoods);
router.post('/:id/moods', authenticateToken, createUserDailyMood);

export default router;