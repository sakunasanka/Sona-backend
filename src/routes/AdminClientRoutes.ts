import { Router } from 'express';
import { check } from 'express-validator';
import clientController from '../controllers/AdminClientController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Client management routes
router.get(
  '/',
  clientController.getAllClients
);

router.get(
  '/stats',
  clientController.getClientStats
);

router.get(
  '/:id',
  clientController.getClientById
);

router.patch(
  '/:id/status',
  [
    check('status')
      .isIn(['active', 'inactive', 'banned'])
      .withMessage('Invalid status value')
  ],
  clientController.updateClientStatus
);

// Student package management routes
router.get(
  '/students/pending',
  clientController.getPendingStudentApplications
);

router.post(
  '/:clientId/student-package/approve',
  [
    check('packageId')
      .notEmpty()
      .withMessage('Package ID is required')
  ],
  clientController.approveStudentPackage
);

router.post(
  '/:clientId/student-package/reject',
  [
    check('rejectionReason')
      .notEmpty()
      .withMessage('Rejection reason is required')
  ],
  clientController.rejectStudentPackage
);

export default router;