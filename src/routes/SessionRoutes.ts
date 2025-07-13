import express from 'express';
import {
  getSessionTypes,
  getCounselors,
  getCounselorById,
  getAvailableTimeSlots,
  getUserPaymentMethods,
  addPaymentMethod,
  bookSession,
  getUserSessions,
  getSessionById,
  cancelSession,
  setCounselorAvailability,
  setCounselorUnavailability
} from '../controllers/SessionController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.get('/types', getSessionTypes);
router.get('/counselors', getCounselors);
router.get('/counselors/:id', getCounselorById);
router.get('/timeslots/:counselorId/:date', getAvailableTimeSlots);
router.post('/availability', setCounselorAvailability);
router.post('/unavailability', setCounselorUnavailability);

// Protected routes (require authentication)
router.get('/payment-methods', getUserPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.post('/', bookSession);
router.get('/my-sessions', getUserSessions);
router.get('/:id', getSessionById);
router.put('/:id/cancel', cancelSession);

export default router;
