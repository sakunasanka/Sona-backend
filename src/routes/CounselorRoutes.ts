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
  getCounselorDetailedProfile,
  getCounselorClients,
  getClientDetails,
  createClientNote,
  deleteClientNote,
  updateClientNote,
  addClientConcern,
  removeClientConcern,
  updateCounselorVolunteerStatus,
  getCounselorVolunteerStatus,
  getCounselorEarningsSummary,
  getCounselorMonthlyEarnings,
  getCounselorEarningsPerClient
} from '../controllers/CounselorController';
import { getUserDailyMoods } from '../controllers/DailyMoodController';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin, isAuthenticated, isProfessional } from '../middlewares/auth';

const router = express.Router();

// Public routes
// Get all available and approved counselors
router.get('/available', getAllAvailableCounselors);

// Protected routes - Counselor only (put these BEFORE dynamic routes)
// Counselor dashboard routes
router.get('/dashboard/stats', isAuthenticated, isProfessional, getDashboardStats);
router.get('/sessions/recent', isAuthenticated, isProfessional, getRecentSessions);
router.get('/activity/recent', isAuthenticated, isProfessional, getRecentActivity);
router.get('/profile', isAuthenticated, isProfessional, getCounselorProfile);

// Counselor profile management routes
router.get('/profile/detailed', isAuthenticated, isProfessional, getCounselorDetailedProfile);
router.put('/profile', isAuthenticated, isProfessional, updateCounselorProfile);
router.get('/volunteer-status', isAuthenticated, isProfessional, getCounselorVolunteerStatus);
router.put('/volunteer-status', isAuthenticated, isProfessional, updateCounselorVolunteerStatus);

// Counselor client management routes
router.get('/clients', isAuthenticated, isProfessional, getCounselorClients);
router.get('/clients/:clientId', isAuthenticated, isProfessional, getClientDetails);
router.post('/clients/:clientId/notes', isAuthenticated, isProfessional, createClientNote);
router.put('/clients/:clientId/notes/:noteId', isAuthenticated, isProfessional, updateClientNote);
router.delete('/clients/:clientId/notes/:noteId', isAuthenticated, isProfessional, deleteClientNote);

// Concerns management
router.post('/clients/:clientId/concerns', isAuthenticated, isProfessional, addClientConcern);
router.delete('/clients/:clientId/concerns', isAuthenticated, isProfessional, removeClientConcern);

// Counselor earnings routes
router.get('/earnings/summary', isAuthenticated, isProfessional, getCounselorEarningsSummary);
router.get('/earnings/monthly', isAuthenticated, isProfessional, getCounselorMonthlyEarnings);
router.get('/earnings/per-client/:clientId', isAuthenticated, isProfessional, getCounselorEarningsPerClient);

// Client moods for counselor
router.get('/clients/:clientId/moods', isAuthenticated, isProfessional, getUserDailyMoods);

// Dynamic routes (put these AFTER static routes to avoid conflicts)
// Get counselor by ID
router.get('/:id', getCounselorById);

// Update counselor's own availability
router.patch('/:id/availability', isAuthenticated, isProfessional, updateCounselorAvailability);

// Admin routes
// Get all counselors (including pending and rejected)
router.get('/', isAuthenticated, isAdmin, getAllCounselors);

// Update counselor status (approve/reject)
router.patch('/:id/status', isAuthenticated, isAdmin, updateCounselorStatus);

export default router;