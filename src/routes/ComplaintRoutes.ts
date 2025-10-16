import express from 'express';
import { ComplaintController } from '../controllers/ComplaintController';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint
 * @access  Private (Authenticated users)
 */
router.post('/', asyncHandler(ComplaintController.createComplaint));

/**
 * @route   GET /api/complaints
 * @desc    Get complaints (filtered by user role)
 * @access  Private (Clients see own, Professionals see all)
 * @query   page?: number, limit?: number, status?: string, session_id?: number
 */
router.get('/', asyncHandler(ComplaintController.getComplaints));

/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint by ID
 * @access  Private (Own complaints or Professional access)
 */
router.get('/:id', asyncHandler(ComplaintController.getComplaintById));

/**
 * @route   PUT /api/complaints/:id/status
 * @desc    Update complaint status (Professional only)
 * @access  Private (Counselor, Admin, Psychiatrist only)
 */
router.put('/:id/status',
  requireRole(['Counselor', 'Admin', 'Psychiatrist']),
  asyncHandler(ComplaintController.updateComplaintStatus)
);

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete complaint (own pending complaints only)
 * @access  Private (Own complaints only)
 */
router.delete('/:id', asyncHandler(ComplaintController.deleteComplaint));

export default router;