import express from 'express';
import {
  getCounselors,
  getCounselorById,
  getAvailableTimeSlots,
  bookSession,
  getUserSessions,
  getSessionById,
  setCounselorAvailability,
  setCounselorUnavailability,
  cancelSession
} from '../controllers/SessionController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.get('/counselors', getCounselors);
router.get('/counselors/:id', getCounselorById);
router.get('/timeslots/:counselorId/:date', getAvailableTimeSlots);

// Protected routes
router.use(authenticateToken);
router.post('/book', bookSession);
router.get('/my-sessions', getUserSessions);
router.get('/:id', getSessionById);
router.put('/:id/cancel', cancelSession);
router.post('/availability', setCounselorAvailability);
router.post('/unavailability', setCounselorUnavailability);

export default router;
