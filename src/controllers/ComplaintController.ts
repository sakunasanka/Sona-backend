import { Request, Response, NextFunction } from 'express';
import ComplaintService, { CreateComplaintData, UpdateComplaintData } from '../services/ComplaintService';
import { validateData, createComplaintSchema, updateComplaintStatusSchema } from '../schema/ValidationSchema';
import { ValidationError, AuthenticationError } from '../utils/errors';
import { ApiResponseUtil } from '../utils/apiResponse';

export class ComplaintController {
  /**
   * Create a new complaint
   * POST /api/complaints
   */
  static async createComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userId = req.user.dbUser.id;

      // Validate request data
      const validatedData = await validateData(createComplaintSchema, req.body) as {
        additional_details?: string;
        session_id: number;
        proof?: string;
        reason?: string;
      };

      // Prepare complaint data
      const complaintData: CreateComplaintData = {
        additional_details: validatedData.additional_details,
        session_id: validatedData.session_id,
        proof: validatedData.proof,
        reason: validatedData.reason,
        user_id: userId
      };

      // Create the complaint
      const complaint = await ComplaintService.createComplaint(complaintData);

      // Return response
      const responseData = {
        id: complaint.complaintId,
        additional_details: complaint.additional_details,
        status: complaint.status,
        proof: complaint.proof,
        reason: complaint.reason,
        session_id: complaint.session_id,
        user_id: complaint.user_id,
        createdAt: complaint.createdAt
      };

      ApiResponseUtil.created(res, responseData, 'Complaint submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complaints (filtered by user role)
   * GET /api/complaints?page=1&limit=10&status=pending
   */
  static async getComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userId = req.user.dbUser.id;
      const userType = req.user.dbUser.userType;

      const { page, limit, status, session_id } = req.query;

      const filters: any = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      };

      // Add filters based on user role
      if (userType === 'Client') {
        // Clients can only see their own complaints
        filters.user_id = userId;
      } else if (['Counselor', 'Admin', 'Psychiatrist'].includes(userType)) {
        // Professionals can see all complaints, but can filter by user/session
        if (status) filters.status = status as string;
        if (session_id) filters.session_id = parseInt(session_id as string);
      } else {
        throw new ValidationError('Unauthorized to view complaints');
      }

      const result = await ComplaintService.getComplaints(filters);

      ApiResponseUtil.success(res, result.complaints, 'Complaints retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complaint by ID
   * GET /api/complaints/:id
   */
  static async getComplaintById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const complaintId = parseInt(req.params.id);
      if (isNaN(complaintId)) {
        throw new ValidationError('Invalid complaint ID');
      }

      const userId = req.user.dbUser.id;
      const userType = req.user.dbUser.userType;

      const complaint = await ComplaintService.getComplaintById(complaintId);

      // Check permissions
      if (userType === 'Client' && complaint.user_id !== userId) {
        throw new ValidationError('You can only view your own complaints');
      }

      ApiResponseUtil.success(res, complaint, 'Complaint retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update complaint status (Counselor/Admin/Psychiatrist only)
   * PUT /api/complaints/:id/status
   */
  static async updateComplaintStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const userType = req.user.dbUser.userType;
      const allowedRoles = ['Counselor', 'Admin', 'Psychiatrist'];

      if (!allowedRoles.includes(userType)) {
        throw new ValidationError('Only counselors, admins, and psychiatrists can update complaint status');
      }

      const complaintId = parseInt(req.params.id);
      if (isNaN(complaintId)) {
        throw new ValidationError('Invalid complaint ID');
      }

      // Validate request data
      const validatedData = await validateData(updateComplaintStatusSchema, req.body) as {
        status: 'pending' | 'resolved' | 'rejected' | 'in review';
        reasonID?: number;
      };

      const updateData: UpdateComplaintData = {
        status: validatedData.status,
        action_by: req.user.dbUser.id,
        reasonID: validatedData.reasonID
      };

      const complaint = await ComplaintService.updateComplaintStatus(complaintId, updateData);

      ApiResponseUtil.success(res, complaint, 'Complaint status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete complaint (own complaints only)
   * DELETE /api/complaints/:id
   */
  static async deleteComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.dbUser) {
        throw new AuthenticationError('Authentication required');
      }

      const complaintId = parseInt(req.params.id);
      if (isNaN(complaintId)) {
        throw new ValidationError('Invalid complaint ID');
      }

      const userId = req.user.dbUser.id;
      const userType = req.user.dbUser.userType;

      // Get complaint to check ownership
      const complaint = await ComplaintService.getComplaintById(complaintId);

      if (userType === 'Client' && complaint.user_id !== userId) {
        throw new ValidationError('You can only delete your own complaints');
      }

      // Only allow deletion of pending complaints
      if (complaint.status !== 'pending') {
        throw new ValidationError('Only pending complaints can be deleted');
      }

      await ComplaintService.deleteComplaint(complaintId);

      ApiResponseUtil.success(res, null, 'Complaint deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default ComplaintController;