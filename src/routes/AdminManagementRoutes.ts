import express from 'express';
import { AdminFeedbackController } from '../controllers/AdminFeedbackController';
import { AdminComplaintController } from '../controllers/AdminComplaintController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

/**
 * @route GET /api/admin/feedbacks
 * @desc Get all feedbacks (reviews) with session, client, and counselor details
 * @access Admin only
 * @query page, limit
 */
router.get('/feedbacks', AdminFeedbackController.getAllFeedbacks);

/**
 * @route GET /api/admin/feedbacks/stats
 * @desc Get feedback statistics
 * @access Admin only
 */
router.get('/feedbacks/stats', AdminFeedbackController.getFeedbackStats);

/**
 * @route GET /api/admin/complaints
 * @desc Get all complaints with full details including client name, counselor name, and rejection reasons
 * @access Admin only
 * @query page, limit, status
 */
router.get('/complaints', AdminComplaintController.getAllComplaints);

/**
 * @route GET /api/admin/complaints/stats
 * @desc Get complaint statistics
 * @access Admin only
 */
router.get('/complaints/stats', AdminComplaintController.getComplaintStats);

export default router;