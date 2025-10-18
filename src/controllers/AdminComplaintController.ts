import { Request, Response, NextFunction } from 'express';
import AdminComplaintService, { AdminComplaintFilters } from '../services/AdminComplaintService';

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
}