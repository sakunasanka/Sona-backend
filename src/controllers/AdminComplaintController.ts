import { Request, Response, NextFunction } from 'express';
import AdminComplaintService, { AdminComplaintFilters } from '../services/AdminComplaintService';
import { NotificationHelper } from '../utils/NotificationHelper';
import Complaint from '../models/Complaint';

export class AdminComplaintController {
  /**
   * Get all complaints with full details for admin
   * GET /api/admin/complaints
   */
  static async getAllComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: AdminComplaintFilters = {
        status: req.query.status as any,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await AdminComplaintService.getAllComplaints(filters);

      res.status(200).json({
        success: true,
        message: 'Complaints retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in AdminComplaintController.getAllComplaints:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch complaints',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get complaint statistics for admin dashboard
   * GET /api/admin/complaints/stats
   */
  static async getComplaintStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminComplaintService.getComplaintStats();

      res.status(200).json({
        success: true,
        message: 'Complaint statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error in AdminComplaintController.getComplaintStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch complaint statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update complaint status and resolution reason (Admin only)
   * PUT /api/admin/complaints/:id/status
   */
  static async updateComplaintStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaintId = parseInt(req.params.id);
      if (isNaN(complaintId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid complaint ID'
        });
        return;
      }

      const { status, resolutionReason } = req.body;

      // Validate status
      const validStatuses = ['pending', 'resolved', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, resolved, rejected'
        });
        return;
      }

      // Get admin user ID (you can modify this based on your auth middleware)
      const adminUserId = (req as any).user?.dbUser?.id;

      // Get complaint to get user_id before updating
      const complaint = await Complaint.findOne({ where: { complaintId } });
      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found'
        });
        return;
      }

      const updatedComplaint = await AdminComplaintService.updateComplaintStatus(
        complaintId,
        status,
        resolutionReason,
        adminUserId
      );

      // Send notification to client
      try {
        await NotificationHelper.complaintResolvedWithReason(
          complaint.user_id, 
          complaintId.toString(), 
          status, 
          resolutionReason
        );
      } catch (notificationError) {
        console.error('Failed to send complaint resolution notification:', notificationError);
        // Don't fail the status update if notification fails
      }

      res.status(200).json({
        success: true,
        message: 'Complaint status updated successfully',
        data: updatedComplaint
      });
    } catch (error) {
      console.error('Error in AdminComplaintController.updateComplaintStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update complaint status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}