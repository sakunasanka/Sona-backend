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
          CASE 
            WHEN c."reasonID" IS NOT NULL THEN (
              SELECT reason FROM rejection_reasons WHERE "userId" = c."reasonID" LIMIT 1
            )
            ELSE NULL
          END as "rejectedReason"
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
}

export default AdminComplaintService;