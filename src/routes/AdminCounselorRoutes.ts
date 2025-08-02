import { Router } from 'express';
import counselorController from '../controllers/AdminCounselorController';
import { check } from 'express-validator';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Get all counselors
router.get(
  '/',
  counselorController.getAllCounselors
);

// Get counselor by ID
router.get(
  '/:id',
  authenticateToken,
  counselorController.getCounselorById
);

// Update counselor status
router.put(
  '/:id/status',
  authenticateToken,
  [
    check('status')
      .isIn(['pending', 'approved', 'rejected', 'unset'])
      .withMessage('Invalid status value'),
    check('rejectionReason')
      .if((value, { req }) => req.body.status === 'rejected')
      .notEmpty()
      .withMessage('Rejection reason is required when status is rejected')
  ],
  counselorController.updateCounselorStatus
);

// Get counselor counts
router.get(
  '/stats/counts',
  authenticateToken,
  counselorController.getCounselorCounts
);

export default router;