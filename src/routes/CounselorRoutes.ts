import express from 'express';
import { 
  getAllAvailableCounselors, 
  getCounselorById, 
  updateCounselorAvailability,
  getAllCounselors,
  updateCounselorStatus,
  getDashboardStats,
  getRecentSessions,
  getRecentActivity,
  getCounselorProfile,
  updateCounselorProfile,
  getCounselorDetailedProfile
} from '../controllers/CounselorController';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin, isAuthenticated, isCounselor } from '../middlewares/auth';

const router = express.Router();

// Public routes
// Get all available and approved counselors
router.get('/available', getAllAvailableCounselors);

// Protected routes - Counselor only (put these BEFORE dynamic routes)
// Counselor dashboard routes
router.get('/dashboard/stats', isAuthenticated, isCounselor, getDashboardStats);
router.get('/sessions/recent', isAuthenticated, isCounselor, getRecentSessions);
router.get('/activity/recent', isAuthenticated, isCounselor, getRecentActivity);
router.get('/profile', isAuthenticated, isCounselor, getCounselorProfile);

// Counselor profile management routes
router.get('/profile/detailed', isAuthenticated, isCounselor, getCounselorDetailedProfile);
router.put('/profile', isAuthenticated, isCounselor, updateCounselorProfile);

// Dynamic routes (put these AFTER static routes to avoid conflicts)
// Get counselor by ID
router.get('/:id', getCounselorById);

// Update counselor's own availability
router.patch('/:id/availability', isAuthenticated, isCounselor, updateCounselorAvailability);

// Admin routes
// Get all counselors (including pending and rejected)
router.get('/', isAuthenticated, isAdmin, getAllCounselors);

// Update counselor status (approve/reject)
router.patch('/:id/status', isAuthenticated, isAdmin, updateCounselorStatus);

export default router;