import express from 'express';
import { PHQ9Controller } from '../controllers/PHQ9Controller';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/questionnaire/phq9/submit
 * @desc    Submit PHQ-9 questionnaire results
 * @access  Private (Authenticated users)
 */
router.post('/submit', asyncHandler(PHQ9Controller.submitPHQ9));

/**
 * @route   GET /api/questionnaire/phq9/history
 * @desc    Get user's PHQ-9 questionnaire history
 * @access  Private (Authenticated users - own results only)
 */
router.get('/history', asyncHandler(PHQ9Controller.getUserHistory));

/**
 * @route   GET /api/questionnaire/phq9/latest
 * @desc    Get user's latest PHQ-9 result
 * @access  Private (Authenticated users - own results only)
 */
router.get('/latest', asyncHandler(PHQ9Controller.getUserLatest));

/**
 * @route   GET /api/questionnaire/phq9/recent-check
 * @desc    Check if user has completed PHQ-9 within specified days
 * @access  Private (Authenticated users - own results only)
 * @query   days?: number (1-365, default: 7)
 */
router.get('/recent-check', asyncHandler(PHQ9Controller.checkRecentAssessment));

/**
 * @route   GET /api/questionnaire/phq9/result/:resultId
 * @desc    Get specific PHQ-9 result by ID
 * @access  Private (Own results) / Professional (Any result for Counselor/Admin/Psychiatrist)
 */
router.get('/result/:resultId', asyncHandler(PHQ9Controller.getResultById));

/**
 * @route   DELETE /api/questionnaire/phq9/result/:resultId
 * @desc    Delete specific PHQ-9 result (soft delete)
 * @access  Private (Own results only)
 */
router.delete('/result/:resultId', asyncHandler(PHQ9Controller.deleteResult));

router.get('/analytics', 
  requireRole(['Counselor', 'Admin', 'Psychiatrist']), 
  asyncHandler(PHQ9Controller.getAnalytics)
);

router.get('/high-risk', 
  requireRole(['Counselor', 'Admin', 'Psychiatrist']), 
  asyncHandler(PHQ9Controller.getHighRiskUsers)
);

router.get('/overview', 
  requireRole(['Counselor', 'Admin', 'Psychiatrist']), 
  asyncHandler(PHQ9Controller.getOverview)
);

export default router;
