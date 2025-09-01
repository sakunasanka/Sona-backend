import { Request, Response, NextFunction } from 'express';
import { PHQ9Service, PHQ9SubmissionData, PHQ9AnalyticsFilters } from '../services/PHQ9Service';
import { validateData, phq9SubmissionSchema, phq9AnalyticsSchema } from '../schema/ValidationSchema';
import { ValidationError, ItemNotFoundError, AuthenticationError } from '../utils/errors';
import { ApiResponseUtil } from '../utils/apiResponse';

// Define simple client input interface
interface PHQ9ClientInput {
  responses: Array<{questionIndex: number, answer: number}>;
  impact?: string;
}

export class PHQ9Controller {
  /**
   * Submit PHQ-9 questionnaire results
   * POST /api/questionnaire/phq9/submit
   */
  static async submitPHQ9(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userId = req.user.dbUser.id;
      
      // Validate request data (only responses and impact)
      const validatedData = await validateData<PHQ9ClientInput>(phq9SubmissionSchema, req.body);
      
      // Convert to service input format
      const submissionData: PHQ9SubmissionData = {
        responses: validatedData.responses,
        impact: validatedData.impact
      };
      
      // Submit the questionnaire (service will calculate scores automatically)
      const result = await PHQ9Service.submitPHQ9(userId, submissionData);
      
      // Return response without sensitive user information
      const responseData = {
        id: result.id,
        userId: result.userId,
        questionnaireType: result.questionnaireType,
        responses: result.responses,
        totalScore: result.totalScore,
        severity: result.severity,
        impact: result.impact,
        hasItem9Positive: result.hasItem9Positive,
        completedAt: result.completedAt,
        createdAt: result.createdAt
      };

      ApiResponseUtil.created(res, responseData, 'PHQ-9 questionnaire submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's PHQ-9 history
   * GET /api/questionnaire/phq9/history?page=1&limit=10
   */
  static async getUserHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userId = req.user.dbUser.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 per page

      if (page < 1 || limit < 1) {
        throw new ValidationError('Page and limit must be positive integers');
      }

      const result = await PHQ9Service.getUserHistory(userId, page, limit);

      // Remove sensitive user information from responses
      const sanitizedResults = result.results.map(item => ({
        id: item.id,
        questionnaireType: item.questionnaireType,
        responses: item.responses,
        totalScore: item.totalScore,
        severity: item.severity,
        impact: item.impact,
        hasItem9Positive: item.hasItem9Positive,
        completedAt: item.completedAt,
        createdAt: item.createdAt
      }));

      ApiResponseUtil.success(res, {
        results: sanitizedResults,
        pagination: result.pagination
      }, 'PHQ-9 history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's latest PHQ-9 result
   * GET /api/questionnaire/phq9/latest
   */
  static async getUserLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userId = req.user.dbUser.id;
      const result = await PHQ9Service.getUserLatest(userId);

      if (!result) {
        ApiResponseUtil.success(res, null, 'No PHQ-9 results found for user');
        return;
      }

      // Remove sensitive user information
      const responseData = {
        id: result.id,
        questionnaireType: result.questionnaireType,
        responses: result.responses,
        totalScore: result.totalScore,
        severity: result.severity,
        impact: result.impact,
        hasItem9Positive: result.hasItem9Positive,
        completedAt: result.completedAt,
        createdAt: result.createdAt
      };

      ApiResponseUtil.success(res, responseData, 'Latest PHQ-9 result retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific PHQ-9 result by ID
   * GET /api/questionnaire/phq9/result/:resultId
   */
  static async getResultById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const resultId = req.params.resultId;
      const userId = req.user.dbUser.id;
      const userType = req.user.dbUser.userType;

      if (!resultId) {
        throw new ValidationError('Result ID is required');
      }

      // Allow users to access their own results, or counselors/admins to access any result
      const allowedRoles = ['Counselor', 'Admin', 'Psychiatrist'];
      const canAccessAnyResult = allowedRoles.includes(userType);
      
      const result = await PHQ9Service.getResultById(
        resultId, 
        canAccessAnyResult ? undefined : userId
      );

      // Include user information for counselors/admins, exclude for regular users
      const responseData = canAccessAnyResult ? {
        id: result.id,
        userId: result.userId,
        user: result.User ? {
          id: result.User.id,
          name: result.User.name,
          email: result.User.email
        } : null,
        questionnaireType: result.questionnaireType,
        responses: result.responses,
        totalScore: result.totalScore,
        severity: result.severity,
        impact: result.impact,
        hasItem9Positive: result.hasItem9Positive,
        completedAt: result.completedAt,
        createdAt: result.createdAt
      } : {
        id: result.id,
        questionnaireType: result.questionnaireType,
        responses: result.responses,
        totalScore: result.totalScore,
        severity: result.severity,
        impact: result.impact,
        hasItem9Positive: result.hasItem9Positive,
        completedAt: result.completedAt,
        createdAt: result.createdAt
      };

      ApiResponseUtil.success(res, responseData, 'PHQ-9 result retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete PHQ-9 result
   * DELETE /api/questionnaire/phq9/result/:resultId
   */
  static async deleteResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const resultId = req.params.resultId;
      const userId = req.user.dbUser.id;

      if (!resultId) {
        throw new ValidationError('Result ID is required');
      }

      await PHQ9Service.deleteResult(resultId, userId);

      ApiResponseUtil.success(res, null, 'PHQ-9 result deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PHQ-9 analytics (Counselor, Psychiatrist, Admin only)
   * GET /api/questionnaire/phq9/analytics
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userType = req.user.dbUser.userType;
      const allowedRoles = ['Counselor', 'Admin', 'Psychiatrist'];
      
      if (!allowedRoles.includes(userType)) {
        throw new ValidationError('Access denied. Counselor, Psychiatrist, or Admin role required.');
      }

      // Validate query parameters
      const filters: PHQ9AnalyticsFilters = {};
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          throw new ValidationError('Invalid start date format');
        }
      }
      
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          throw new ValidationError('Invalid end date format');
        }
      }
      
      if (req.query.severity) {
        const validSeverities = ['Minimal or none', 'Mild', 'Moderate', 'Moderately severe', 'Severe'];
        if (!validSeverities.includes(req.query.severity as string)) {
          throw new ValidationError('Invalid severity level');
        }
        filters.severity = req.query.severity as string;
      }
      
      if (req.query.hasItem9Positive !== undefined) {
        filters.hasItem9Positive = req.query.hasItem9Positive === 'true';
      }

      const analytics = await PHQ9Service.getAnalytics(filters);

      ApiResponseUtil.success(res, analytics, 'PHQ-9 analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get high-risk users (Counselor, Psychiatrist, Admin only)
   * GET /api/questionnaire/phq9/high-risk?days=30
   */
  static async getHighRiskUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userType = req.user.dbUser.userType;
      const allowedRoles = ['Counselor', 'Admin', 'Psychiatrist'];
      
      if (!allowedRoles.includes(userType)) {
        throw new ValidationError('Access denied. Counselor, Psychiatrist, or Admin role required.');
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      if (isNaN(days) || days < 1 || days > 365) {
        throw new ValidationError('Days must be a number between 1 and 365');
      }

      const highRiskUsers = await PHQ9Service.getHighRiskUsers({ days });

      ApiResponseUtil.success(res, {
        users: highRiskUsers,
        filters: { days },
        summary: {
          totalHighRisk: highRiskUsers.length,
          criticalRisk: highRiskUsers.filter(u => u.riskLevel === 'CRITICAL').length,
          highRisk: highRiskUsers.filter(u => u.riskLevel === 'HIGH').length
        }
      }, 'High-risk users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PHQ-9 statistics overview (Counselor, Psychiatrist, Admin only)
   * GET /api/questionnaire/phq9/overview
   */
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userType = req.user.dbUser.userType;
      const allowedRoles = ['Counselor', 'Admin', 'Psychiatrist'];
      
      if (!allowedRoles.includes(userType)) {
        throw new ValidationError('Access denied. Counselor, Psychiatrist, or Admin role required.');
      }

      // Get analytics for last 30 days
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const analytics = await PHQ9Service.getAnalytics({ startDate: last30Days });
      const highRiskUsers = await PHQ9Service.getHighRiskUsers({ days: 30 });

      const overview = {
        period: 'Last 30 days',
        totalAssessments: analytics.totalAssessments,
        averageScore: analytics.averageScore,
        severityBreakdown: analytics.severityBreakdown,
        riskMonitoring: {
          totalRiskAssessments: analytics.riskAssessments,
          criticalRisk: highRiskUsers.filter(u => u.riskLevel === 'CRITICAL').length,
          highRisk: highRiskUsers.filter(u => u.riskLevel === 'HIGH').length
        },
        trends: {
          weekly: analytics.weeklyTrends.slice(-4), // Last 4 weeks
          monthly: analytics.monthlyTrends.slice(-3) // Last 3 months
        }
      };

      ApiResponseUtil.success(res, overview, 'PHQ-9 overview retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has recent PHQ-9 assessment
   * GET /api/questionnaire/phq9/recent-check?days=7
   */
  static async checkRecentAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userId = req.user.dbUser.id;
      
      // Validate and parse days parameter
      const daysParam = req.query.days as string;
      let days = 7; // Default to 7 days
      
      if (daysParam) {
        const parsedDays = parseInt(daysParam, 10);
        if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
          throw new ValidationError('Days parameter must be a number between 1 and 365');
        }
        days = parsedDays;
      }

      // Calculate the date cutoff
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Check for recent assessments
      const recentAssessment = await PHQ9Service.getRecentAssessment(userId, cutoffDate);

      const responseData = {
        hasRecent: !!recentAssessment,
        lastAssessmentDate: recentAssessment ? recentAssessment.completedAt : null,
        daysChecked: days,
        cutoffDate: cutoffDate.toISOString()
      };

      ApiResponseUtil.success(res, responseData, 
        recentAssessment 
          ? `User has completed PHQ-9 within the last ${days} days` 
          : `No PHQ-9 assessments found within the last ${days} days`
      );
    } catch (error) {
      next(error);
    }
  }
}

export default PHQ9Controller;
