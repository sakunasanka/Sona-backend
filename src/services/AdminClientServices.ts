import Client from '../models/Client';
import Student from '../models/Student';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';

export interface ClientWithStudentInfo {
  id: number;
  firebaseId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isStudent: boolean;
  nickName?: string;
  concerns?: any[];
  registeredDate: Date;
  status: 'active' | 'inactive' | 'suspended';
  age?: number;
  location?: string;
  bio?: string;
  clientType: 'regular' | 'student';
  sessionsCompleted: number;
  totalSpent: number;
  subscriptionType?: string;
  studentPackage?: {
    applied: boolean;
    status: 'pending' | 'approved' | 'rejected';
    appliedDate?: string;
    school?: string;
    studentId?: string;
    graduationYear?: string;
    verificationDocument?: string;
    rejectionReason?: string;
  };
}

export interface ClientFilters {
  search?: string;
  status?: string;
  clientType?: string;
  page?: number;
  limit?: number;
}

class AdminClientServices {
  async getAllClients(filters: ClientFilters = {}): Promise<ClientWithStudentInfo[]> {
    const { search, status, clientType, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = ['u.role = \'Client\''];
    const replacements: any[] = [];

    if (search) {
      whereConditions.push(`(LOWER(u.name) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?))`);
      replacements.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", 
        u."email", 
        u."avatar", 
        u."role", 
        u."createdAt" as "registeredDate",
        c."nickName", 
        c."isStudent",
        c."concerns",
        'active' as status,
        30 as age,
        'Unknown Location' as location,
        'No bio available' as bio,
        CASE 
          WHEN c."isStudent" = true THEN 'student' 
          ELSE 'regular' 
        END as "clientType",
        0 as "sessionsCompleted",
        0 as "totalSpent",
        CASE 
          WHEN c."isStudent" = true THEN 'student' 
          ELSE 'regular' 
        END as "subscriptionType"
      FROM users u
      JOIN clients c ON u.id = c."userId"
      ${whereClause}
      ORDER BY u."createdAt" DESC
      LIMIT ? OFFSET ?
    `;

    const clients = await sequelize.query(query, {
      replacements: [...replacements, limit, offset],
      type: QueryTypes.SELECT
    });

    // Attach student package info safely
    const clientsWithStudentInfo = await Promise.all(
      clients.map(async (client: any) => {
        const studentInfo = await Student.findByClientId(client.id);

        return {
          ...client,
          studentPackage: studentInfo ? {
            applied: true,
            status: studentInfo.applicationStatus,
            appliedDate: studentInfo.createdAt.toISOString().split('T')[0],
            school: studentInfo.university,
            studentId: studentInfo.studentIDCopy,
            graduationYear: undefined,
            verificationDocument: undefined,
            rejectionReason: studentInfo.rejectionReason || undefined
          } : {
            applied: client.isStudent,
            status: 'pending'
          }
        };
      })
    );

    return clientsWithStudentInfo;
  }

  async getClientById(id: number): Promise<ClientWithStudentInfo | null> {
    const client = await Client.findClientById(id);
    if (!client) return null;

    const studentInfo = await Student.findByClientId(id);

    return {
      id: client.userId,
      firebaseId: client.firebaseId,
      name: client.name,
      email: client.email,
      avatar: client.avatar,
      role: client.role,
      isStudent: client.isStudent,
      nickName: client.nickName,
      concerns: client.concerns,
      registeredDate: client.createdAt,
      status: 'active',
      age: 30,
      location: 'Unknown Location',
      bio: 'No bio available',
      clientType: client.isStudent ? 'student' : 'regular',
      sessionsCompleted: 0,
      totalSpent: 0,
      subscriptionType: client.isStudent ? 'student' : 'regular',
      studentPackage: studentInfo ? {
        applied: true,
        status: studentInfo.applicationStatus,
        appliedDate: studentInfo.createdAt.toISOString().split('T')[0],
        school: studentInfo.university,
        studentId: studentInfo.studentIDCopy,
        graduationYear: undefined,
        verificationDocument: undefined,
        rejectionReason: studentInfo.rejectionReason || undefined
      } : {
        applied: client.isStudent,
        status: 'pending'
      }
    };
  }

  async updateClientStatus(id: number, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> {
    try {
      return true; // Placeholder
    } catch (error) {
      console.error('Error updating client status:', error);
      return false;
    }
  }

  async getClientStats() {
    const totalClients = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.role = 'Client'
    `, { type: QueryTypes.SELECT });

    const activeClients = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.role = 'Client'
    `, { type: QueryTypes.SELECT });

    const studentClients = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.role = 'Client' AND c."isStudent" = true
    `, { type: QueryTypes.SELECT });

    const regularClients = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.role = 'Client' AND c."isStudent" = false
    `, { type: QueryTypes.SELECT });

    return {
      total: parseInt((totalClients[0] as { count: string }).count),
      active: parseInt((activeClients[0] as { count: string }).count),
      inactive: 0,
      students: parseInt((studentClients[0] as { count: string }).count),
      regular: parseInt((regularClients[0] as { count: string }).count)
    };
  }
}

export default new AdminClientServices();
