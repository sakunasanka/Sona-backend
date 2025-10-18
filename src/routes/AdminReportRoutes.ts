import express from 'express';
import * as reportsController from '../controllers/AdminReportsController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Apply authentication middleware to all reports routes
router.use(authenticateToken);

/**
 * @route GET /api/admin/reports/session-analytics
 * @desc Get session analytics report
 * @access Admin only
 */
router.get('/session-analytics', reportsController.getSessionAnalyticsReport);

/**
 * @route GET /api/admin/reports/counselors
 * @desc Get approved counselors report
 * @access Admin only
 */
router.get('/counselors', reportsController.getApprovedCounselorsReport);

/**
 * @route GET /api/admin/reports/psychiatrists
 * @desc Get approved psychiatrists report
 * @access Admin only
 */
router.get('/psychiatrists', reportsController.getApprovedPsychiatristsReport);

/**
 * @route GET /api/admin/reports/financial
 * @desc Get financial report with detailed analytics
 * @access Admin only
 */
router.get('/financial', reportsController.getFinancialReport);

export default router;

