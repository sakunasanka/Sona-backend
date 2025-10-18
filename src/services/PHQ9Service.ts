import QuestionnaireResult, { PHQ9Response, QuestionnaireResultCreationAttributes } from '../models/QuestionnaireResult';
import { ValidationError, ItemNotFoundError, ConflictError } from '../utils/errors';
import { Op } from 'sequelize';
import { encrypt } from '../middlewares/encrypt';

export interface PHQ9SubmissionData {
  responses: PHQ9Response[];
  impact?: string;
}

export interface PHQ9InternalData {
  responses: PHQ9Response[];
  totalScore: number;
  severity: 'Minimal or none' | 'Mild' | 'Moderate' | 'Moderately severe' | 'Severe';
  impact?: string;
  hasItem9Positive: boolean;
  completedAt: Date;
}

export interface PHQ9AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  severity?: string;
  hasItem9Positive?: boolean;
}

export interface PHQ9AnalyticsResult {
  totalAssessments: number;
  severityBreakdown: {
    [key: string]: number;
  };
  averageScore: number;
  riskAssessments: number; // Count of positive item 9 responses
  weeklyTrends: Array<{
    week: string;
    count: number;
    averageScore: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    averageScore: number;
  }>;
}

export class PHQ9Service {
  /**
   * Submit a new PHQ-9 questionnaire result
   */
  static async submitPHQ9(userId: number, submissionData: PHQ9SubmissionData): Promise<QuestionnaireResult> {
    try {
      // Validate responses before proceeding
      QuestionnaireResult.validateResponses(submissionData.responses);
      
      // Calculate all required fields automatically
      const calculatedScore = QuestionnaireResult.calculateTotalScore(submissionData.responses);
      const calculatedSeverity = QuestionnaireResult.calculateSeverity(calculatedScore);
      const calculatedItem9 = QuestionnaireResult.checkItem9Positive(submissionData.responses);
      const completedAt = new Date();

      const creationData: QuestionnaireResultCreationAttributes = {
        userId,
        questionnaireType: 'PHQ9',
        responses: submissionData.responses,
        totalScore: calculatedScore,
        severity: calculatedSeverity,
        impact: submissionData.impact,
        hasItem9Positive: calculatedItem9,
        completedAt: completedAt,
      };

      // 1. Create the record. This instance will have the new ID.
      const createdResult = await QuestionnaireResult.create(creationData);
      
      // 2. Log high-risk cases using the *original plaintext variables*
      //    (This is safer, as `createdResult.hasItem9Positive` might be encrypted)
      if (calculatedItem9 || calculatedScore >= 15) {
        console.warn(`⚠️  High-risk PHQ-9 submission detected:`, {
          userId,
          resultId: createdResult.id, // Get the ID from the created record
          totalScore: calculatedScore, // Use original plaintext
          severity: calculatedSeverity, // Use original plaintext
          hasItem9Positive: calculatedItem9, // Use original plaintext
          completedAt: completedAt
        });
      }

      // 3. Re-fetch the result by its ID to get the properly decrypted instance
      //    This triggers the 'afterFind' hooks which decrypt the data.
      const finalResult = await QuestionnaireResult.findByPk(createdResult.id);

      if (!finalResult) {
        // This should not happen, but it's good to have a safeguard
        throw new ItemNotFoundError('Failed to retrieve PHQ-9 result immediately after creation.');
      }

      // 4. Return the new, fully decrypted result
      return finalResult;
      
    } catch (error) {
      console.error('Error submitting PHQ-9 questionnaire:', error);
      throw error;
    }
  }

  /**
   * Get user's PHQ-9 history with pagination
   */
  static async getUserHistory(userId: number, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await QuestionnaireResult.findUserHistory(userId, limit, offset);
      
      return {
        results: result.rows,
        pagination: {
          total: result.count,
          page,
          limit,
          totalPages: Math.ceil(result.count / limit),
          hasNext: page * limit < result.count,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching user PHQ-9 history:', error);
      throw error;
    }
  }

  /**
   * Get user's full PHQ-9 history (no pagination)
   */
  static async getUserHistoryFull(userId: number): Promise<QuestionnaireResult[]> {
    try {
      const results = await QuestionnaireResult.findAll({
        where: { userId, deletedAt: { [Op.is]: null } } as any,
        order: [['completedAt', 'DESC']]
      });
      return results;
    } catch (error) {
      console.error('Error fetching full user PHQ-9 history:', error);
      throw error;
    }
  }

  /**
   * Get user's latest PHQ-9 result
   */
  static async getUserLatest(userId: number): Promise<QuestionnaireResult | null> {
    try {
      return await QuestionnaireResult.findUserLatest(userId);
    } catch (error) {
      console.error('Error fetching latest PHQ-9 result:', error);
      throw error;
    }
  }

  /**
   * Check if user has recent PHQ-9 assessment within specified timeframe
   */
  static async getRecentAssessment(userId: number, cutoffDate: Date): Promise<QuestionnaireResult | null> {
    try {
      return await QuestionnaireResult.findOne({
        where: {
          userId,
          completedAt: { [Op.gte]: cutoffDate },
          deletedAt: { [Op.is]: null }
        } as any,
        order: [['completedAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error checking for recent PHQ-9 assessment:', error);
      throw error;
    }
  }

  /**
   * Get specific PHQ-9 result by ID
   */
  static async getResultById(resultId: string, userId?: number): Promise<QuestionnaireResult> {
    try {
      const whereClause: any = { 
        id: resultId,
        deletedAt: { [Op.is]: null }
      };
      
      // If userId is provided, ensure user can only access their own results
      if (userId) {
        whereClause.userId = userId;
      }

      const result = await QuestionnaireResult.findOne({
        where: whereClause,
        include: [{
          model: QuestionnaireResult.associations.User?.target,
          as: 'User',
          attributes: ['id', 'name', 'email']
        }]
      });

      if (!result) {
        throw new ItemNotFoundError('PHQ-9 result not found or access denied');
      }

      return result;
    } catch (error) {
      console.error('Error fetching PHQ-9 result by ID:', error);
      throw error;
    }
  }

  /**
   * Delete a PHQ-9 result (soft delete)
   */
  static async deleteResult(resultId: string, userId: number): Promise<void> {
    try {
      const result = await QuestionnaireResult.findOne({
        where: { 
          id: resultId,
          userId,
          deletedAt: { [Op.is]: null }
        } as any,
      });

      if (!result) {
        throw new ItemNotFoundError('PHQ-9 result not found or access denied');
      }

      await result.softDelete();
    } catch (error) {
      console.error('Error deleting PHQ-9 result:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics for counselors/admins
   */
  static async getAnalytics(filters: PHQ9AnalyticsFilters = {}): Promise<PHQ9AnalyticsResult> {
    try {
      const whereClause: any = { deletedAt: { [Op.is]: null } };
      
      if (filters.startDate) {
        whereClause.completedAt = { [Op.gte]: filters.startDate };
      }
      if (filters.endDate) {
        whereClause.completedAt = { 
          ...whereClause.completedAt, 
          [Op.lte]: filters.endDate 
        };
      }
      if (filters.severity) {
        whereClause.severity = encrypt(filters.severity);
      }
      if (filters.hasItem9Positive !== undefined) {
        whereClause.hasItem9Positive = encrypt(filters.hasItem9Positive.toString());
      }

      // Get all matching results
      const results = await QuestionnaireResult.findAll({
        where: whereClause,
        order: [['completedAt', 'DESC']]
      });

      // Calculate analytics
      const totalAssessments = results.length;
      const averageScore = totalAssessments > 0 
        ? results.reduce((sum, r) => sum + r.totalScore, 0) / totalAssessments 
        : 0;
      
      const riskAssessments = results.filter(r => r.hasItem9Positive).length;

      // Severity breakdown
      const severityBreakdown = results.reduce((acc, result) => {
        acc[result.severity] = (acc[result.severity] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Weekly trends (last 12 weeks)
      const weeklyTrends = this.calculateWeeklyTrends(results);
      
      // Monthly trends (last 12 months)
      const monthlyTrends = this.calculateMonthlyTrends(results);

      return {
        totalAssessments,
        severityBreakdown,
        averageScore: Math.round(averageScore * 100) / 100,
        riskAssessments,
        weeklyTrends,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error generating PHQ-9 analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate weekly trends for the last 12 weeks
   */
  private static calculateWeeklyTrends(results: QuestionnaireResult[]): Array<{week: string, count: number, averageScore: number}> {
    const trends = new Map<string, {count: number, totalScore: number}>();
    const now = new Date();
    
    // Initialize last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = this.getWeekKey(weekStart);
      trends.set(weekKey, { count: 0, totalScore: 0 });
    }

    // Aggregate results by week
    results.forEach(result => {
      const weekKey = this.getWeekKey(result.completedAt);
      const existing = trends.get(weekKey);
      if (existing) {
        existing.count++;
        existing.totalScore += result.totalScore;
      }
    });

    // Convert to array with averages
    return Array.from(trends.entries()).map(([week, data]) => ({
      week,
      count: data.count,
      averageScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 100) / 100 : 0
    }));
  }

  /**
   * Calculate monthly trends for the last 12 months
   */
  private static calculateMonthlyTrends(results: QuestionnaireResult[]): Array<{month: string, count: number, averageScore: number}> {
    const trends = new Map<string, {count: number, totalScore: number}>();
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = this.getMonthKey(monthStart);
      trends.set(monthKey, { count: 0, totalScore: 0 });
    }

    // Aggregate results by month
    results.forEach(result => {
      const monthKey = this.getMonthKey(result.completedAt);
      const existing = trends.get(monthKey);
      if (existing) {
        existing.count++;
        existing.totalScore += result.totalScore;
      }
    });

    // Convert to array with averages
    return Array.from(trends.entries()).map(([month, data]) => ({
      month,
      count: data.count,
      averageScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 100) / 100 : 0
    }));
  }

  /**
   * Get week key for grouping (YYYY-WW format)
   */
  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Get month key for grouping (YYYY-MM format)
   */
  private static getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get high-risk users (for counselor monitoring)
   */
  static async getHighRiskUsers(filters: { days?: number } = {}): Promise<Array<{
    userId: number;
    userName: string;
    userEmail: string;
    latestScore: number;
    latestSeverity: string;
    hasItem9Positive: boolean;
    completedAt: Date;
    riskLevel: 'HIGH' | 'CRITICAL';
  }>> {
    try {
      const days = filters.days || 30; // Default to last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch all recent results and filter in application code due to encrypted fields
      const allResults = await QuestionnaireResult.findAll({
        where: {
          completedAt: { [Op.gte]: startDate },
          deletedAt: { [Op.is]: null }
        } as any,
        include: [{
          model: QuestionnaireResult.associations.User?.target,
          as: 'User',
          attributes: ['id', 'name', 'email']
        }],
        order: [['completedAt', 'DESC']]
      });

      // Filter for high-risk cases (hasItem9Positive = true OR totalScore >= 15)
      const results = allResults.filter(result => 
        result.hasItem9Positive || result.totalScore >= 15
      );

      // Get latest result per user
      const userLatestResults = new Map();
      results.forEach(result => {
        const userId = result.userId;
        if (!userLatestResults.has(userId) || 
            result.completedAt > userLatestResults.get(userId).completedAt) {
          userLatestResults.set(userId, result);
        }
      });

      return Array.from(userLatestResults.values()).map(result => ({
        userId: result.userId,
        userName: result.User?.name || 'Unknown',
        userEmail: result.User?.email || 'Unknown',
        latestScore: result.totalScore,
        latestSeverity: result.severity,
        hasItem9Positive: result.hasItem9Positive,
        completedAt: result.completedAt,
        riskLevel: result.hasItem9Positive ? 'CRITICAL' : 'HIGH'
      }));
    } catch (error) {
      console.error('Error fetching high-risk users:', error);
      throw error;
    }
  }
}

export default PHQ9Service;
