import express from 'express';
import * as dashboardController from '../controllers/AdminDashboardController';
import { authenticateToken } from '../middlewares/auth';
import {
  validateDashboardQuery,
  validateDateRange,
  handleValidationErrors
} from '../middlewares/validation';

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

/**
 * @route GET /api/admin/dashboard/overview
 * @desc Get complete dashboard overview
 * @access Admin only
 */
router.get('/overview', dashboardController.getDashboardOverview);

/**
 * @route GET /api/admin/dashboard/metrics
 * @desc Get main metrics (first row cards)
 * @access Admin only
 */
router.get('/metrics', dashboardController.getMainMetrics);

/**
 * @route GET /api/admin/dashboard/login-metrics
 * @desc Get login statistics by user type
 * @access Admin only
 * @query period - Time period (7d, 30d, 3m, 6m, 1y)
 */
router.get('/login-metrics', validateDashboardQuery, dashboardController.getLoginMetrics);

/**
 * @route GET /api/admin/dashboard/session-breakdown
 * @desc Get session breakdown by type and status
 * @access Admin only
 */
router.get('/session-breakdown', dashboardController.getSessionBreakdown);

/**
 * @route GET /api/admin/dashboard/monthly-users
 * @desc Get monthly user growth data
 * @access Admin only
 * @query months - Number of months to fetch (default: 5)
 */
router.get('/monthly-users', validateDashboardQuery, dashboardController.getMonthlyUsersData);

/**
 * @route GET /api/admin/dashboard/daily-sessions
 * @desc Get daily session data
 * @access Admin only
 * @query days - Number of days to fetch (default: 7)
 */
router.get('/daily-sessions', validateDashboardQuery, dashboardController.getDailySessionsData);

/**
 * @route GET /api/admin/dashboard/monthly-growth
 * @desc Get monthly growth data with growth rates
 * @access Admin only
 * @query months - Number of months to fetch (default: 6)
 */
router.get('/monthly-growth', validateDashboardQuery, dashboardController.getMonthlyGrowthData);

/**
 * @route GET /api/admin/dashboard/monthly-revenue
 * @desc Get monthly revenue data
 * @access Admin only
 * @query months - Number of months to fetch (default: 6)
 */
router.get('/monthly-revenue', validateDashboardQuery, dashboardController.getMonthlyRevenueData);

/**
 * @route GET /api/admin/dashboard/session-types
 * @desc Get session distribution by specialty/type
 * @access Admin only
 * @query period - Time period (7d, 30d, 3m)
 */
// router.get('/session-types', validateDashboardQuery, dashboardController.getSessionTypesData);

/**
 * @route GET /api/admin/dashboard/user-distribution
 * @desc Get user demographics/age distribution
 * @access Admin only
 */
// router.get('/user-distribution', dashboardController.getUserDistribution);

/**
 * @route GET /api/admin/dashboard/session-status
 * @desc Get session status distribution
 * @access Admin only
 * @query period - Time period (7d, 30d, 3m)
 */
router.get('/session-status', validateDashboardQuery, dashboardController.getSessionStatusData);

/**
 * @route GET /api/admin/dashboard/recent-activities
 * @desc Get recent platform activities
 * @access Admin only
 * @query limit - Number of activities to fetch (default: 10)
 */
router.get('/recent-activities', validateDashboardQuery, dashboardController.getRecentActivities);

/**
 * @route GET /api/admin/dashboard/top-counselors
 * @desc Get top performing counselors
 * @access Admin only
 * @query limit - Number of counselors to fetch (default: 10)
 * @query period - Time period (7d, 30d, 3m)
 */
router.get('/top-counselors', validateDashboardQuery, dashboardController.getTopCounselors);

/**
 * @route GET /api/admin/dashboard/complete
 * @desc Get all dashboard data in one request
 * @access Admin only
 * @query period - Time period for relevant data (default: 30d)
 */
router.get('/complete', validateDashboardQuery, dashboardController.getCompleteDashboard);

/**
 * @route GET /api/admin/dashboard/test-complete
 * @desc Test endpoint without authentication
 * @access Public (for testing)
 */
router.get('/test-complete', dashboardController.getCompleteDashboard);

/**
 * @route GET /api/admin/dashboard/health
 * @desc Get system health status
 * @access Admin only
 */
router.get('/health', dashboardController.getHealthStatus);

export default router;

