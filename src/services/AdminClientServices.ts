import Client from '../models/Client';
import Student from '../models/Student';
import Session from '../models/Session';
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
  clientType: 'regular' | 'student';
  sessionsCompleted: number;
  totalSpent: number;
  subscriptionType?: string;
  studentPackage?: {
    applied: boolean;
    status?: 'pending' | 'approved' | 'rejected';
    appliedDate?: string;
    school?: string;
    uniEmail?: string;
    studentIDCopy?: string;
    clientID?: string;
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
    const { search, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const whereConditions = ["u.role = 'Client'"];
    const replacements: any[] = [];

    if (search) {
      whereConditions.push(`(LOWER(u.name) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?))`);
      replacements.push(`%${search}%`, `%${search}%`);
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", 
        u."email", 
        u."avatar", 
        u."role", 
        u."createdAt" AS "registeredDate",
        c."nickName", 
        c."isStudent",
        c."concerns",
        s."applicationStatus" AS "status",
        s."university" AS "school",
        s."uniEmail",
        s."clientID",
        s."rejectionReason",
        s."studentIDCopy",
        s."createdAt" AS "appliedDate",
        COALESCE(sess."sessionsCompleted", 0) AS "sessionsCompleted",
        COALESCE(sess."totalSpent", 0) AS "totalSpent"
      FROM users u
      JOIN clients c ON u.id = c."userId"
      LEFT JOIN students s ON c."userId" = s."clientID"
      LEFT JOIN (
        SELECT 
          "userId",
          COUNT(*) AS "sessionsCompleted",
          SUM("price") AS "totalSpent"
        FROM sessions
        WHERE "status" = 'completed'
        GROUP BY "userId"
      ) sess ON u.id = sess."userId"
      ${whereClause}
      ORDER BY u."createdAt" DESC
      LIMIT ? OFFSET ?
    `;

    const clients = await sequelize.query(query, {
      replacements: [...replacements, limit, offset],
      type: QueryTypes.SELECT,
    });

    return clients.map((client: any) => {
      const isStudent =
        client.isStudent === true && client.status === 'approved';

      const hasApplied = !!client.status;

      const studentPackage = hasApplied
        ? {
            applied: true,
            status: client.status,
            appliedDate: client.appliedDate,
            school: client.school,
            uniEmail: client.uniEmail,
            clientID: client.clientID,
            studentIDCopy: client.studentIDCopy,
            rejectionReason: client.rejectionReason,
          }
        : { applied: false };

      return {
        id: client.id,
        firebaseId: client.firebaseId,
        name: client.name,
        email: client.email,
        avatar: client.avatar,
        role: client.role,
        isStudent,
        nickName: client.nickName,
        concerns: client.concerns,
        registeredDate: client.registeredDate,
        clientType: isStudent ? 'student' : 'regular',
        sessionsCompleted: Number(client.sessionsCompleted) || 0,
        totalSpent: Number(client.totalSpent) || 0,
        subscriptionType: isStudent ? 'student' : 'regular',
        studentPackage,
      };
    });
  }

  async getClientById(id: number): Promise<ClientWithStudentInfo | null> {
    const query = `
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", 
        u."email", 
        u."avatar", 
        u."role", 
        u."createdAt" AS "registeredDate",
        c."nickName", 
        c."isStudent",
        c."concerns",
        s."applicationStatus" AS "status",
        s."university" AS "school",
        s."uniEmail",
        s."clientID",
        s."studentIDCopy",
        s."rejectionReason",
        s."createdAt" AS "appliedDate",
        COALESCE(sess."sessionsCompleted", 0) AS "sessionsCompleted",
        COALESCE(sess."totalSpent", 0) AS "totalSpent"
      FROM users u
      JOIN clients c ON u.id = c."userId"
      LEFT JOIN students s ON c."userId" = s."clientID"
      LEFT JOIN (
        SELECT 
          "userId",
          COUNT(*) AS "sessionsCompleted",
          SUM("price") AS "totalSpent"
        FROM sessions
        WHERE "status" = 'completed'
        GROUP BY "userId"
      ) sess ON u.id = sess."userId"
      WHERE u.id = ?
    `;

    const result = await sequelize.query(query, {
      replacements: [id],
      type: QueryTypes.SELECT,
    });

    if (result.length === 0) return null;

    const client = result[0] as any;
    const isStudent =
      client.isStudent === true && client.status === 'approved';

    const hasApplied = !!client.status;

    const studentPackage = hasApplied
      ? {
          applied: true,
          status: client.status,
          appliedDate: client.appliedDate,
          school: client.school,
          uniEmail: client.uniEmail,
          clientID: client.clientID,
          studentIDCopy: client.studentIDCopy,
          rejectionReason: client.rejectionReason,
        }
      : { applied: false };

    return {
      id: client.id,
      firebaseId: client.firebaseId,
      name: client.name,
      email: client.email,
      avatar: client.avatar,
      role: client.role,
      isStudent,
      nickName: client.nickName,
      concerns: client.concerns,
      registeredDate: client.registeredDate,
      clientType: isStudent ? 'student' : 'regular',
      sessionsCompleted: Number(client.sessionsCompleted) || 0,
      totalSpent: Number(client.totalSpent) || 0,
      subscriptionType: isStudent ? 'student' : 'regular',
      studentPackage,
    };
  }

  async getClientStats() {
    const totalClients = await sequelize.query(
      `
      SELECT COUNT(*) AS count
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.role = 'Client'
    `,
      { type: QueryTypes.SELECT }
    );

    const studentClients = await sequelize.query(
      `
      SELECT COUNT(*) AS count
      FROM users u
      JOIN clients c ON u.id = c."userId"
      LEFT JOIN students s ON c."userId" = s."clientID"
      WHERE u.role = 'Client' AND c."isStudent" = true AND s."applicationStatus" = 'approved'
    `,
      { type: QueryTypes.SELECT }
    );

    const regularClients = await sequelize.query(
      `
      SELECT COUNT(*) AS count
      FROM users u
      JOIN clients c ON u.id = c."userId"
      LEFT JOIN students s ON c."userId" = s."clientID"
      WHERE u.role = 'Client' AND (c."isStudent" = false OR s."applicationStatus" != 'approved')
    `,
      { type: QueryTypes.SELECT }
    );

    return {
      total: parseInt((totalClients[0] as { count: string }).count),
      students: parseInt((studentClients[0] as { count: string }).count),
      regular: parseInt((regularClients[0] as { count: string }).count),
    };
  }
}

export default new AdminClientServices();
