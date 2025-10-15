import express from 'express';
import { 
  getAvailablePsychiatrists,
  getPsychiatristById,
  updatePsychiatristAvailability,
  getAllPsychiatrists,
  updatePsychiatristStatus,
  uploadPrescription,
  getPrescriptionsByPsychiatrist
} from '../controllers/PsychiatristController';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin, isAuthenticated, isProfessional } from '../middlewares/auth';
import { getUserDailyMoods } from '../controllers/DailyMoodController';

const router = express.Router();

// Public routes
// Get all available and approved psychiatrists
router.get('/available', getAvailablePsychiatrists);

// Specific routes must come BEFORE parameterized routes
// Upload prescription (Psychiatrist only)
router.post('/prescription', isAuthenticated, isProfessional, uploadPrescription);

// Get all prescriptions by psychiatrist for a specific client (Psychiatrist only)
router.get('/prescriptions/:clientId', isAuthenticated, isProfessional, getPrescriptionsByPsychiatrist);

// Admin routes
// Get all psychiatrists (including pending and rejected)
router.get('/', isAuthenticated, isAdmin, getAllPsychiatrists);

// Get psychiatrist by ID (this must come AFTER specific routes)
router.get('/:id', getPsychiatristById);

// Protected routes - Psychiatrist only
// Update psychiatrist's own availability
router.patch('/:id/availability', isAuthenticated, isProfessional, updatePsychiatristAvailability);

// Update psychiatrist status (approve/reject)
router.patch('/:id/status', isAuthenticated, isAdmin, updatePsychiatristStatus);

// Psychiatrist can view a client's daily moods
router.get('/clients/:clientId/moods', isAuthenticated, isProfessional, getUserDailyMoods);

export default router;
