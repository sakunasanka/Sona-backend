import express from 'express';
import { 
  getAllAvailableCounselors, 
  getCounselorById, 
  updateCounselorAvailability,
  getAllCounselors,
  updateCounselorStatus
} from '../controllers/CounselorController';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin, isAuthenticated, isCounselor } from '../middlewares/auth';

const router = express.Router();

// Public routes
// Get all available and approved counselors
router.get('/available', getAllAvailableCounselors);

// Get counselor by ID
router.get('/:id', getCounselorById);

// Protected routes - Counselor only
// Update counselor's own availability
router.patch('/:id/availability', isAuthenticated, isCounselor, updateCounselorAvailability);

// Admin routes
// Get all counselors (including pending and rejected)
router.get('/', isAuthenticated, isAdmin, getAllCounselors);

// Update counselor status (approve/reject)
router.patch('/:id/status', isAuthenticated, isAdmin, updateCounselorStatus);

export default router;