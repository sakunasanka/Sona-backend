import express from 'express';
import { 
  getAvailablePsychiatrists,
  getPsychiatristById,
  updatePsychiatristAvailability,
  getAllPsychiatrists,
  updatePsychiatristStatus
} from '../controllers/PsychiatristController';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin, isAuthenticated, isProfessional } from '../middlewares/auth';
import { getUserDailyMoods } from '../controllers/DailyMoodController';

const router = express.Router();

// Public routes
// Get all available and approved psychiatrists
router.get('/available', getAvailablePsychiatrists);

// Get psychiatrist by ID
router.get('/:id', getPsychiatristById);

// Protected routes - Psychiatrist only
// Update psychiatrist's own availability
router.patch('/:id/availability', isAuthenticated, isProfessional, updatePsychiatristAvailability);

// Admin routes
// Get all psychiatrists (including pending and rejected)
router.get('/', isAuthenticated, isAdmin, getAllPsychiatrists);

// Update psychiatrist status (approve/reject)
router.patch('/:id/status', isAuthenticated, isAdmin, updatePsychiatristStatus);

// Psychiatrist can view a client's daily moods
router.get('/clients/:clientId/moods', isAuthenticated, isProfessional, getUserDailyMoods);

export default router;
