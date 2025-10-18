import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review';
import User from '../models/User';
import Session from '../models/Session';
import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

export class AdminFeedbackController {
  /**
   * Get all feedbacks (reviews) with session details
   * GET /api/admin/feedbacks
   */
  static async getAllFeedbacks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get all reviews with session, client, and counselor details
      const query = `
        SELECT 
          r.review_id,
          r.session_id as "sessionId",
          r.rating,
          r.comment,
          r."createdAt" as "createdDate",
          s.date as "sessionDate",
          s."timeSlot" as "timeSlot",
          client_user.name as "clientName",
          counselor_user.name as "counselorName",
          counselor_user.role as "counselorRole",
          s.status as "sessionStatus"
        FROM reviews r
        JOIN sessions s ON r.session_id = s.id
        JOIN users client_user ON s."userId" = client_user.id
        LEFT JOIN clients c ON client_user.id = c."userId"
        JOIN users counselor_user ON s."counselorId" = counselor_user.id
        ORDER BY r."createdAt" DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM reviews r
      `;

      const [feedbacks, countResult] = await Promise.all([
        sequelize.query(query, {
          bind: [limit, offset],
          type: QueryTypes.SELECT
        }),
        sequelize.query(countQuery, {
          type: QueryTypes.SELECT
        })
      ]);

      const total = parseInt((countResult[0] as any).total);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        message: 'Feedbacks retrieved successfully',
        data: {
          feedbacks,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedbacks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feedback statistics
   * GET /api/admin/feedbacks/stats
   */
  static async getFeedbackStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as "totalFeedbacks",
          AVG(rating) as "averageRating",
          COUNT(CASE WHEN rating = 5 THEN 1 END) as "fiveStarCount",
          COUNT(CASE WHEN rating = 4 THEN 1 END) as "fourStarCount",
          COUNT(CASE WHEN rating = 3 THEN 1 END) as "threeStarCount",
          COUNT(CASE WHEN rating = 2 THEN 1 END) as "twoStarCount",
          COUNT(CASE WHEN rating = 1 THEN 1 END) as "oneStarCount"
        FROM reviews
      `;

      const [stats] = await sequelize.query(statsQuery, {
        type: QueryTypes.SELECT
      });

      res.status(200).json({
        success: true,
        message: 'Feedback statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}