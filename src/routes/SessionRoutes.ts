import express from 'express';
import {
  getCounselors,
  getCounselorById,
  getAvailableTimeSlots,
  getPsychiatrists,
  getPsychiatristById,
  getPsychiatristAvailableTimeSlots,
  bookSession,
  getUserSessions,
  getSessionById,
  getSessionLink,
  setCounselorAvailability,
  setCounselorUnavailability,
  cancelSession,
  getCounselorSessions,
  getRemainingStudentSessions,
  getCounselorMonthlyAvailability,
  getBooked
} from '../controllers/SessionController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.get('/counselors', getCounselors);
router.get('/counselors/:id', getCounselorById);
router.get('/timeslots/:counselorId/:date', getAvailableTimeSlots);
router.get('/counselors/:id/availability/:year/:month', getCounselorMonthlyAvailability);

// Psychiatrist routes
router.get('/psychiatrists', getPsychiatrists);
router.get('/psychiatrists/:id', getPsychiatristById);
router.get('/psychiatrist-timeslots/:psychiatristId/:date', getPsychiatristAvailableTimeSlots);

// Protected routes
router.use(authenticateToken);
router.post('/book', bookSession);
router.get('/my-sessions', getUserSessions);
router.get('/remaining', getRemainingStudentSessions);
router.get('/bookedSessions', getBooked);
router.get('/:id', getSessionById);
router.get('/:id/link', getSessionLink);
router.put('/:id/cancel', cancelSession);
router.post('/availability', setCounselorAvailability);
router.post('/unavailability', setCounselorUnavailability);
router.get('/counselor/:id', getCounselorSessions);

router.get('/getSessionLink/:id', getSessionLink);

export default router;
