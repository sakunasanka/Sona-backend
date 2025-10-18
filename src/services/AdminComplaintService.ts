import Complaint from '../models/Complaint';
import User from '../models/User';
import Session from '../models/Session';
import RejectionReason from '../models/Rejection_reasons';
import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

export interface AdminComplaintFilters {
  status?: 'pending' | 'resolved' | 'rejected';
  page?: number;
  limit?: number;
}

class AdminComplaintService {
  /**
   * Get all complaints with full details for admin
   */
  static async getAllComplaints(filters: AdminComplaintFilters = {}) {
    try {
      const { status, page = 1, limit = 10 } = filters;
      const offset = (page - 1) * limit;

      let whereClause = '';
      const bindParams: any[] = [limit, offset];
      let paramIndex = 3;

      if (status) {
        whereClause = 'WHERE c.status = $3';
        bindParams.splice(2, 0, status); // Insert status at index 2
        paramIndex = 4;
      }

      const query = `
        SELECT 
          c."complaintId",
          c.session_id as "sessionId",
          c.additional_details as "description",
          c.proof,
          c.status,
          c.reason,
          c."createdAt" as "createdDate",
          c."updatedAt" as "updatedDate",
          client_user.name as "clientName",
          counselor_user.name as "counselorName",
          counselor_user.role as "counselorRole",
          s.date as "sessionDate",
          s."timeSlot" as "timeSlot",
          c.resolution_reason as "resolutionReason"
        FROM complaints c
        JOIN sessions s ON c.session_id = s.id
        JOIN users client_user ON c.user_id = client_user.id
        LEFT JOIN clients client_c ON client_user.id = client_c."userId"
        JOIN users counselor_user ON s."counselorId" = counselor_user.id
        ${whereClause}
        ORDER BY c."createdAt" DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM complaints c
        ${whereClause.replace('$3', '$1')}
      `;

      const countBindParams = status ? [status] : [];

      const [complaints, countResult] = await Promise.all([
        sequelize.query(query, {
          bind: bindParams,
          type: QueryTypes.SELECT
        }),
        sequelize.query(countQuery, {
          bind: countBindParams,
          type: QueryTypes.SELECT
        })
      ]);

      const total = parseInt((countResult[0] as any).total);
      const totalPages = Math.ceil(total / limit);

      return {
        complaints,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in AdminComplaintService.getAllComplaints:', error);
      throw error;
    }
  }

  /**
   * Get complaint statistics for admin dashboard
   */
  static async getComplaintStats() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as "totalComplaints",
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as "pendingCount",
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as "resolvedCount", 
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as "rejectedCount"
        FROM complaints
      `;

      const [stats] = await sequelize.query(statsQuery, {
        type: QueryTypes.SELECT
      });

      return stats;
    } catch (error) {
      console.error('Error in AdminComplaintService.getComplaintStats:', error);
      throw error;
    }
  }

  /**
   * Update complaint status and resolution reason (Admin only)
   */
  static async updateComplaintStatus(
    complaintId: number, 
    status: 'pending' | 'resolved' | 'rejected',
    resolutionReason?: string,
    actionBy?: number
  ) {
    try {
      const updateQuery = `
        UPDATE complaints 
        SET 
          status = $1,
          resolution_reason = $2,
          action_by = $3,
          "updatedAt" = NOW()
        WHERE "complaintId" = $4
        RETURNING *
      `;

      const [result] = await sequelize.query(updateQuery, {
        bind: [status, resolutionReason || null, actionBy || null, complaintId],
        type: QueryTypes.UPDATE
      });

      if (!result) {
        throw new Error('Complaint not found');
      }

      // Get the updated complaint with full details
      const updatedComplaint = await this.getComplaintById(complaintId);
      return updatedComplaint;
    } catch (error) {
      console.error('Error in AdminComplaintService.updateComplaintStatus:', error);
      throw error;
    }
  }

  /**
   * Get complaint by ID with full details
   */
  static async getComplaintById(complaintId: number) {
    try {
      const query = `
        SELECT 
          c."complaintId",
          c.session_id as "sessionId",
          c.additional_details as "description",
          c.proof,
          c.status,
          c.reason,
          c."createdAt" as "createdDate",
          c."updatedAt" as "updatedDate",
          CASE 
            WHEN client_c."nickName" IS NOT NULL AND client_c."nickName" != '' THEN client_c."nickName"
            ELSE client_user.name
          END as "clientName",
          counselor_user.name as "counselorName",
          counselor_user.role as "counselorRole",
          s.date as "sessionDate",
          s."timeSlot" as "timeSlot",
          c.resolution_reason as "resolutionReason"
        FROM complaints c
        JOIN sessions s ON c.session_id = s.id
        JOIN users client_user ON c.user_id = client_user.id
        LEFT JOIN clients client_c ON client_user.id = client_c."userId"
        JOIN users counselor_user ON s."counselorId" = counselor_user.id
        WHERE c."complaintId" = $1
      `;

      const [complaint] = await sequelize.query(query, {
        bind: [complaintId],
        type: QueryTypes.SELECT
      });

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      return complaint;
    } catch (error) {
      console.error('Error in AdminComplaintService.getComplaintById:', error);
      throw error;
    }
  }
}

export default AdminComplaintService;