import { Router } from 'express';
import psychiatristController from '../controllers/AdminPsychiatristController';
import { check } from 'express-validator';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Get all psychiatrists
router.get(
  '/',
  psychiatristController.getAllPsychiatrists
);

// Get psychiatrist by ID
router.get(
  '/:id',
  authenticateToken,
  psychiatristController.getPsychiatristById
);

// Update psychiatrist status
router.put(
  '/:id/status',
  authenticateToken,
  [
    check('status')
      .isIn(['pending', 'approved', 'rejected', 'unset'])
      .withMessage('Invalid status value'),
    check('rejectionReason')
      .if((value, { req }) => req.body.status === 'Rejected')
      .notEmpty()
      .withMessage('Rejection reason is required when status is Rejected')
  ],
  psychiatristController.updatePsychiatristStatus
);

// Get psychiatrist counts
router.get(
  '/stats/counts',
  authenticateToken,
  psychiatristController.getPsychiatristCounts
);

export default router;