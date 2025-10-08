import Complaint from '../models/Complaint';
import User from '../models/User';
import Session from '../models/Session';
import { Op } from 'sequelize';

export interface CreateComplaintData {
  additional_details?: string;
  session_id: number;
  proof?: string;
  reason?: string;
  user_id: number;
}

export interface UpdateComplaintData {
  status?: 'pending' | 'resolved' | 'rejected' | 'in review';
  action_by?: number;
  reasonID?: number;
}

export interface ComplaintFilters {
  status?: 'pending' | 'resolved' | 'rejected' | 'in review';
  user_id?: number;
  session_id?: number;
  page?: number;
  limit?: number;
}

class ComplaintService {
  /**
   * Create a new complaint
   */
  static async createComplaint(data: CreateComplaintData) {
    try {
      // Verify that the session exists and belongs to the user
      const session = await Session.findOne({
        where: {
          id: data.session_id,
          [Op.or]: [
            { userId: data.user_id }, // Client's session
            { counselorId: data.user_id } // Counselor's session
          ]
        }
      });

      if (!session) {
        throw new Error('Session not found or you do not have permission to complain about this session');
      }

      const complaint = await Complaint.create({
        ...data,
        status: 'pending'
      });
      return complaint;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get complaints with filters and pagination
   */
  static async getComplaints(filters: ComplaintFilters = {}) {
    try {
      const {
        status,
        user_id,
        session_id,
        page = 1,
        limit = 10
      } = filters;

      const whereClause: any = {};

      if (status) {
        whereClause.status = status;
      }

      if (user_id) {
        whereClause.user_id = user_id;
      }

      if (session_id) {
        whereClause.session_id = session_id;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Complaint.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: Session,
            as: 'session',
            attributes: ['id', 'date', 'timeSlot', 'duration', 'status']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        complaints: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get complaint by ID
   */
  static async getComplaintById(id: number) {
    try {
      const complaint = await Complaint.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: Session,
            as: 'session',
            attributes: ['id', 'date', 'timeSlot', 'duration', 'status']
          }
        ]
      });

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      return complaint;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update complaint status (for counselors/admins)
   */
  static async updateComplaintStatus(id: number, data: UpdateComplaintData) {
    try {
      const complaint = await Complaint.findByPk(id);

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      await complaint.update(data);
      return complaint;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete complaint (soft delete if needed)
   */
  static async deleteComplaint(id: number) {
    try {
      const complaint = await Complaint.findByPk(id);

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      await complaint.destroy();
      return { message: 'Complaint deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}

export default ComplaintService;