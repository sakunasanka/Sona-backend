import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review';
import Session from '../models/Session';
import { ApiResponseUtil } from '../utils/apiResponse';
import { ValidationError, AuthenticationError } from '../utils/errors';

export class ReviewController {
  /**
   * Create a review for a completed session
   * POST /api/reviews
   */
  static async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id, rating, comment } = req.body as {
        session_id: number;
        rating: number;
        comment?: string;
      };

      // Validate required fields
      if (!session_id || typeof session_id !== 'number') {
        throw new ValidationError('Valid session_id is required');
      }

      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be a number between 1 and 5');
      }

      // Ensure the authenticated user is creating the review
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userId = req.user.dbUser.id;

      // Check if the session exists and belongs to the authenticated client
      // Only clients who booked the session can provide feedback
      const session = await Session.findOne({
        where: { id: session_id, userId }
      });

      if (!session) {
        throw new ValidationError('Session not found or does not belong to you');
      }

      // Feedback can only be provided for completed sessions
      if (session.status !== 'completed') {
        throw new ValidationError('You can only review sessions that have been completed');
      }

      // Check if a review already exists for this session
      const existingReview = await Review.findOne({
        where: { sessionId: session_id }
      });

      if (existingReview) {
        throw new ValidationError('Review already exists for this session');
      }

      // Create the review
      const review = await Review.create({
        userId,
        sessionId: session_id,
        rating,
        comment: comment?.trim() || undefined
      });

      ApiResponseUtil.success(res, review, 'Review submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if feedback has been submitted for a session
   * GET /api/reviews/session/:sessionId
   */
  static async checkReviewStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;

      // Validate sessionId
      const sessionIdNum = Number(sessionId);
      if (!sessionIdNum || isNaN(sessionIdNum)) {
        throw new ValidationError('Valid session ID is required');
      }

      // Ensure the authenticated user has access to this session
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userId = req.user.dbUser.id;

      // Check if the session exists and belongs to the user
      const session = await Session.findOne({
        where: { id: sessionIdNum, userId }
      });

      if (!session) {
        throw new ValidationError('Session not found or does not belong to you');
      }

      // Check if a review exists for this session
      const existingReview = await Review.findOne({
        where: { sessionId: sessionIdNum },
        attributes: ['review_id', 'rating', 'comment', 'createdAt']
      });

      ApiResponseUtil.success(res, {
        sessionId: sessionIdNum,
        hasFeedback: !!existingReview,
        feedback: existingReview || null
      }, 'Review status checked successfully');
    } catch (error) {
      next(error);
    }
  }
}