import { ValidationError, ItemNotFoundError, DatabaseError } from '../utils/errors';
import Counselor from '../models/Counselor';
import Psychiatrist from '../models/Psychiatrist';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';

export interface CounselorResponse {
  id: number;
  firebaseId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  title: string;
  specialities: string[];
  address: string;
  contact_no: string;
  license_no: string;
  idCard: string;
  isVolunteer?: boolean;
  isAvailable?: boolean;
  description?: string;
  rating?: number;
  sessionFee?: number;
  status?: string;
  coverImage?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
  website?: string;
  languages?: string[];
}

export class CounselorService {
  /**
   * Get all available counselors that are approved
   */
  static async getAllAvailableCounselors(): Promise<CounselorResponse[]> {
    try {
      const results = await sequelize.query(`
        SELECT 
          u.id, 
          u."firebaseId", 
          u."name", 
          u."email", 
          u."avatar", 
          u."role", 
          c."title", 
          c."specialities", 
          c."address", 
          c."contact_no", 
          c."licenseNo" as "license_no", 
          c."idCard",
          c."isVolunteer", 
          c."isAvailable", 
          c."description", 
          c."rating", 
          c."sessionFee",
          c."status",
          c."coverImage", 
          c."instagram", 
          c."linkedin", 
          c."x", 
          c."website",
          c."languages"
        FROM users u
        JOIN counselors c ON u.id = c."userId"
        WHERE u."role" = 'Counselor' AND c."isAvailable" = true AND c."status" = 'approved'
      `, {
        type: QueryTypes.SELECT
      });

      return results.map((data: any) => ({
        id: data.id,
        firebaseId: data.firebaseId,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        role: data.role,
        title: data.title,
        specialities: data.specialities,
        address: data.address,
        contact_no: data.contact_no,
        license_no: data.license_no,
        idCard: data.idCard,
        isVolunteer: data.isVolunteer,
        isAvailable: data.isAvailable,
        description: data.description,
        rating: data.rating,
        sessionFee: data.sessionFee,
        status: data.status,
        coverImage: data.coverImage,
        instagram: data.instagram,
        linkedin: data.linkedin,
        x: data.x,
        website: data.website,
        languages: data.languages
      }));
    } catch (error) {
      console.error('Error fetching available counselors:', error);
      throw new DatabaseError('Failed to fetch available counselors');
    }
  }

  /**
   * Get counselor by ID
   */
  static async getCounselorById(id: number): Promise<CounselorResponse> {
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new ValidationError('Counselor ID is required and must be a positive number');
    }

    const results = await sequelize.query(`
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", 
        u."email", 
        u."avatar", 
        u."role", 
        c."title", 
        c."specialities", 
        c."address", 
        c."contact_no", 
        c."licenseNo" as "license_no", 
        c."idCard",
        c."isVolunteer", 
        c."isAvailable", 
        c."description", 
        c."rating", 
        c."sessionFee",
        c."status",
        c."coverImage", 
        c."instagram", 
        c."linkedin", 
        c."x", 
        c."website",
        c."languages"
      FROM users u
      JOIN counselors c ON u.id = c."userId"
      WHERE u.id = ? AND u."role" = 'Counselor'
    `, {
      replacements: [id],
      type: QueryTypes.SELECT
    });

    if (results.length === 0) {
      throw new ItemNotFoundError('Counselor not found with the provided ID');
    }

    const data = results[0] as any;
    return {
      id: data.id,
      firebaseId: data.firebaseId,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      role: data.role,
      title: data.title,
      specialities: data.specialities,
      address: data.address,
      contact_no: data.contact_no,
      license_no: data.license_no,
      idCard: data.idCard,
      isVolunteer: data.isVolunteer,
      isAvailable: data.isAvailable,
      description: data.description,
      rating: data.rating,
      sessionFee: data.sessionFee,
      status: data.status,
      coverImage: data.coverImage,
      instagram: data.instagram,
      linkedin: data.linkedin,
      x: data.x,
      website: data.website,
      languages: data.languages
    };
  }

  /**
   * Update counselor availability status
   */
  static async updateCounselorAvailability(id: number, isAvailable: boolean): Promise<CounselorResponse> {
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new ValidationError('Counselor ID is required and must be a positive number');
    }

    if (typeof isAvailable !== 'boolean') {
      throw new ValidationError('isAvailable must be a boolean value');
    }

    try {
      // First, find the counselor
      const counselor = await Counselor.findCounselorById(id);
      
      if (!counselor) {
        throw new ItemNotFoundError('Counselor not found with the provided ID');
      }

      // Update availability in the database
      await sequelize.query(`
        UPDATE counselors
        SET "isAvailable" = $1, "updatedAt" = NOW()
        WHERE "userId" = $2
      `, {
        bind: [isAvailable, id],
        type: QueryTypes.UPDATE
      });

      // Update the counselor object
      counselor.isAvailable = isAvailable;
      
      return {
        id: counselor.id,
        firebaseId: counselor.firebaseId,
        name: counselor.name,
        email: counselor.email,
        avatar: counselor.avatar,
        role: counselor.role,
        title: counselor.title,
        specialities: counselor.specialities,
        address: counselor.address,
        contact_no: counselor.contact_no,
        license_no: counselor.license_no,
        idCard: counselor.idCard,
        isVolunteer: counselor.isVolunteer,
        isAvailable: isAvailable,
        description: counselor.description,
        rating: counselor.rating,
        sessionFee: counselor.sessionFee,
        status: counselor.status,
        coverImage: counselor.coverImage,
        instagram: counselor.instagram,
        linkedin: counselor.linkedin,
        x: counselor.x,
        website: counselor.website,
        languages: counselor.languages
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update counselor availability');
    }
  }

  /**
   * Get dashboard statistics for a counselor
   */
  static async getDashboardStatistics(counselorId: number) {
    try {
      const [
        totalSessionsResult,
        upcomingSessionsResult, 
        totalClientsResult,
        monthlySessionsResult,
        totalBlogsResult
      ] = await Promise.all([
        // Count total sessions
        sequelize.query(`SELECT COUNT(*) as count FROM sessions WHERE "counselorId" = ?`, {
          replacements: [counselorId],
          type: QueryTypes.SELECT
        }),
        // Count upcoming sessions  
        sequelize.query(`SELECT COUNT(*) as count FROM sessions WHERE "counselorId" = ? AND date >= CURRENT_DATE AND status = 'scheduled'`, {
          replacements: [counselorId],
          type: QueryTypes.SELECT
        }),
        // Count unique clients
        sequelize.query(`SELECT COUNT(DISTINCT "userId") as count FROM sessions WHERE "counselorId" = ?`, {
          replacements: [counselorId], 
          type: QueryTypes.SELECT
        }),
        // Count sessions this month for earnings calculation
        sequelize.query(`SELECT COUNT(*) as count, AVG(price) as avgPrice FROM sessions WHERE "counselorId" = ? AND date >= date_trunc('month', CURRENT_DATE) AND status = 'completed'`, {
          replacements: [counselorId],
          type: QueryTypes.SELECT
        }),
        // Count blogs/posts by this counselor
        sequelize.query(`SELECT COUNT(*) as count FROM posts WHERE "userId" = ?`, {
          replacements: [counselorId],
          type: QueryTypes.SELECT
        })
      ]);

      const totalSessions = (totalSessionsResult[0] as any).count || 0;
      const upcomingSessions = (upcomingSessionsResult[0] as any).count || 0;
      const totalClients = (totalClientsResult[0] as any).count || 0;
      const monthlyData = monthlySessionsResult[0] as any;
      const monthlyEarnings = (monthlyData.count || 0) * (monthlyData.avgprice || 0);
      const totalBlogs = (totalBlogsResult[0] as any).count || 0;

      // Get counselor's current rating
      const counselorData = await sequelize.query(`
        SELECT rating FROM counselors WHERE "userId" = ?
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      const averageRating = counselorData.length > 0 ? (counselorData[0] as any).rating || 0 : 0;

      return {
        totalSessions: parseInt(totalSessions),
        upcomingSessions: parseInt(upcomingSessions),
        totalClients: parseInt(totalClients),
        averageRating: parseFloat(averageRating) || 0,
        monthlyEarnings: Math.round(monthlyEarnings) || 0,
        totalBlogs: parseInt(totalBlogs),
        sessionCompletionRate: totalSessions > 0 ? Math.round(((totalSessions - upcomingSessions) / totalSessions) * 100) : 0,
        clientSatisfaction: parseFloat(averageRating) || 0,
        averageResponseTime: "2 hours" // This would need a messages/chat system to calculate properly
      };
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw new DatabaseError('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get recent sessions for a counselor
   */
  static async getRecentSessions(counselorId: number, limit: number) {
    try {
      const sessions = await sequelize.query(`
        SELECT 
          s.id,
          s.date,
          s."timeSlot" as time,
          s.status,
          u.name as "clientName",
          s.concerns,
          s."createdAt"
        FROM sessions s
        JOIN users u ON s."userId" = u.id  
        WHERE s."counselorId" = ?
        ORDER BY s.date DESC, s."timeSlot" DESC
        LIMIT ?
      `, {
        replacements: [counselorId, limit],
        type: QueryTypes.SELECT
      });

      return sessions.map((session: any) => ({
        id: session.id,
        clientName: session.clientName,
        date: session.date,
        time: session.time,
        status: session.status,
        isAnonymous: false // For now, assuming not anonymous - can be updated when anonymity is implemented
      }));
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      throw new DatabaseError('Failed to fetch recent sessions');
    }
  }

  /**
   * Get recent activity for a counselor
   */
  static async getRecentActivity(counselorId: number, limit: number) {
    try {
      // Combine different types of activities
      const [sessionActivities, postActivities] = await Promise.all([
        // Recent sessions
        sequelize.query(`
          SELECT 
            s.id,
            'session' as type,
            CASE 
              WHEN s.status = 'completed' THEN 'Session completed with ' || u.name
              WHEN s.status = 'scheduled' THEN 'Session scheduled with ' || u.name
              WHEN s.status = 'cancelled' THEN 'Session cancelled with ' || u.name
            END as description,
            s."updatedAt" as timestamp,
            s.status
          FROM sessions s
          JOIN users u ON s."userId" = u.id  
          WHERE s."counselorId" = ?
          ORDER BY s."updatedAt" DESC
          LIMIT ?
        `, {
          replacements: [counselorId, Math.ceil(limit / 2)],
          type: QueryTypes.SELECT
        }),
        // Recent posts
        sequelize.query(`
          SELECT 
            p.id,
            'post' as type,
            'Published new blog post' as description,
            p."createdAt" as timestamp,
            'published' as status
          FROM posts p
          WHERE p."userId" = ?
          ORDER BY p."createdAt" DESC
          LIMIT ?
        `, {
          replacements: [counselorId, Math.ceil(limit / 2)],
          type: QueryTypes.SELECT
        })
      ]);

      // Combine and sort all activities
      const allActivities = [...sessionActivities, ...postActivities]
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return allActivities.map((activity: any, index: number) => ({
        id: index + 1,
        type: activity.type,
        description: activity.description,
        timestamp: activity.timestamp,
        icon: activity.type === 'session' ? 'calendar' : 'book'
      }));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw new DatabaseError('Failed to fetch recent activity');
    }
  }

  /**
   * Get counselor profile information
   */
  static async getCounselorProfile(counselorId: number) {
    try {
      // First get the user's role
      const userResult = await sequelize.query(`
        SELECT role FROM users WHERE id = ?
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      if (userResult.length === 0) {
        throw new ItemNotFoundError('User not found');
      }

      const userRole = (userResult[0] as any).role;
      const tableName = userRole === 'Psychiatrist' ? 'psychiatrists' : 'counselors';

      const profile = await sequelize.query(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.avatar,
          p.title,
          p.specialities,
          p.description,
          p.rating,
          p."isAvailable",
          p.address,
          p.contact_no as phone,
          p."sessionFee"
        FROM users u
        JOIN ${tableName} p ON u.id = p."userId"
        WHERE u.id = ?
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      if (profile.length === 0) {
        throw new ItemNotFoundError('Profile not found');
      }

      const profileData = profile[0] as any;

      return {
        success: true,
        message: "Profile retrieved successfully",
        data: {
          ...profileData,
          profileImage: " "
        }
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      console.error('Error fetching profile:', error);
      throw new DatabaseError('Failed to fetch profile');
    }
  }

  /**
   * Get detailed counselor profile for profile page
   */
  static async getCounselorDetailedProfile(counselorId: number) {
    try {
      // First get the user's role
      const userResult = await sequelize.query(`
        SELECT role FROM users WHERE id = ?
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      if (userResult.length === 0) {
        throw new ItemNotFoundError('User not found');
      }

      const userRole = (userResult[0] as any).role;
      const tableName = userRole === 'Psychiatrist' ? 'psychiatrists' : 'counselors';

      const profile = await sequelize.query(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.avatar,
          p.title,
          p.specialities as specializations,
          p.description as bio,
          p.rating,
          p."isAvailable",
          p."isVolunteer",
          p.address,
          p.contact_no as phone,
          p."sessionFee",
          p."createdAt" as "joinDate",
          p."updatedAt" as "lastActiveAt",
          p."coverImage",
          p.instagram,
          p.linkedin,
          p.x,
          p.website,
          p.languages
        FROM users u
        JOIN ${tableName} p ON u.id = p."userId"
        WHERE u.id = ?
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      if (profile.length === 0) {
        throw new ItemNotFoundError('Profile not found');
      }

      const profileData = profile[0] as any;

      // Get credentials (education qualifications)
      const credentials = await sequelize.query(`
        SELECT 
          id,
          title,
          institution,
          year,
          status
        FROM edu_qualifications 
        WHERE "userId" = ? AND status = 'approved'
        ORDER BY year DESC
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      // Get achievements (experiences)
      const achievements = await sequelize.query(`
        SELECT 
          id,
          title,
          description,
          date,
          status
        FROM experiences 
        WHERE "userId" = ? AND status = 'approved'
        ORDER BY date DESC
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      // Get statistics
      const [sessionsStats, clientsStats] = await Promise.all([
        sequelize.query(`SELECT COUNT(*) as total FROM sessions WHERE "counselorId" = ?`, {
          replacements: [counselorId],
          type: QueryTypes.SELECT
        }),
        sequelize.query(`SELECT COUNT(DISTINCT "userId") as total FROM sessions WHERE "counselorId" = ?`, {
          replacements: [counselorId],
          type: QueryTypes.SELECT
        })
      ]);

      const totalSessions = (sessionsStats[0] as any).total || 0;
      const totalClients = (clientsStats[0] as any).total || 0;

      // Parse name into first and last name
      const fullName = profileData.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: profileData.id,
        firstName,
        lastName,
        profileImage: profileData.avatar || '/assets/images/default-avatar.png',
        coverImage: profileData.coverImage || '/assets/images/counsellor-banner.jpg',
        bio: profileData.bio || 'Passionate mental health counselor dedicated to helping individuals achieve their wellness goals.',
        location: profileData.address || 'Colombo, Sri Lanka',
        website: profileData.website || null,
        email: profileData.email,
        phone: profileData.phone || '(071) 123-4567',
        joinDate: new Date(profileData.joinDate).toISOString(),
        specializations: Array.isArray(profileData.specializations) 
          ? profileData.specializations 
          : (typeof profileData.specializations === 'string' 
            ? (profileData.specializations.startsWith('[') ? JSON.parse(profileData.specializations) : [profileData.specializations])
            : (profileData.specializations ? [profileData.specializations] : ["Anxiety Disorders", "Depression", "Trauma Therapy"])),
        languages: Array.isArray(profileData.languages) 
          ? profileData.languages 
          : (typeof profileData.languages === 'string' 
            ? (profileData.languages.startsWith('[') ? JSON.parse(profileData.languages) : [profileData.languages])
            : (profileData.languages ? [profileData.languages] : ['English', 'Sinhala', 'Tamil'])),
        experience: new Date().getFullYear() - new Date(profileData.joinDate).getFullYear() || 8,
        rating: parseFloat(profileData.rating) || 4.9,
        totalReviews: 127, // Can be enhanced with reviews table
        totalSessions: parseInt(totalSessions),
        totalClients: parseInt(totalClients),
        status: profileData.isAvailable ? 'available' : 'unavailable',
        lastActiveAt: new Date(profileData.lastActiveAt).toISOString(),
        socialLinks: {
          instagram: profileData.instagram || null,
          linkedin: profileData.linkedin || null,
          x: profileData.x || null
        },
        credentials: credentials.map((cred: any) => ({
          id: cred.id,
          title: cred.title,
          institution: cred.institution,
          year: cred.year,
          status: cred.status
        })),
        achievements: achievements.map((achievement: any) => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          date: achievement.date,
          status: achievement.status
        }))
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      console.error('Error fetching detailed counselor profile:', error);
      throw new DatabaseError('Failed to fetch detailed counselor profile');
    }
  }

  /**
   * Update counselor profile
   */
  static async updateCounselorProfile(counselorId: number, updateData: any) {
    try {
      const transaction = await sequelize.transaction();

      try {
        // First get the user's role to determine which table to update
        const userResult = await sequelize.query(`
          SELECT role FROM users WHERE id = ?
        `, {
          replacements: [counselorId],
          type: QueryTypes.SELECT,
          transaction
        });

        if (userResult.length === 0) {
          throw new ItemNotFoundError('User not found');
        }

        const userRole = (userResult[0] as any).role;
        const tableName = userRole === 'Psychiatrist' ? 'psychiatrists' : 'counselors';

        // Update user table (map profileImage -> users.avatar)
        if (
          updateData.firstName !== undefined ||
          updateData.lastName !== undefined ||
          updateData.email !== undefined ||
          updateData.profileImage !== undefined
        ) {
          const name = `${updateData.firstName || ''} ${updateData.lastName || ''}`.trim();
          await sequelize.query(`
            UPDATE users 
            SET name = COALESCE(?, name),
                email = COALESCE(?, email),
                avatar = COALESCE(?, avatar),
                "updatedAt" = NOW()
            WHERE id = ?
          `, {
            replacements: [
              name || null,
              updateData.email || null,
              updateData.profileImage || null,
              counselorId
            ],
            transaction
          });
        }

        // Update professional table (counselors or psychiatrists)
        const professionalFields = [
          'bio', 'specializations', 'phone', 'location', 'coverImage', 'instagram', 'linkedin', 'x', 'website', 'languages'
        ];
        
        const hasUpdateFields = professionalFields.some(field => updateData[field] !== undefined);
        
        if (hasUpdateFields) {
          await sequelize.query(`
            UPDATE ${tableName} 
            SET description = COALESCE(?, description),
                specialities = COALESCE(?, specialities),
                contact_no = COALESCE(?, contact_no),
                address = COALESCE(?, address),
                "coverImage" = COALESCE(?, "coverImage"),
                instagram = COALESCE(?, instagram),
                linkedin = COALESCE(?, linkedin),
                x = COALESCE(?, x),
                website = COALESCE(?, website),
                languages = COALESCE(?, languages),
                "updatedAt" = NOW()
            WHERE "userId" = ?
          `, {
            replacements: [
              updateData.bio || null,
              updateData.specializations ? JSON.stringify(updateData.specializations) : null,
              updateData.phone || null,
              updateData.location || null,
              updateData.coverImage || null,
              updateData.instagram || null,
              updateData.linkedin || null,
              updateData.x || null,
              updateData.website || null,
              updateData.languages ? JSON.stringify(updateData.languages) : null,
              counselorId
            ],
            transaction
          });
        }

        await transaction.commit();

        // Return updated profile
        return await this.getCounselorDetailedProfile(counselorId);

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new DatabaseError('Failed to update profile');
    }
  }

  /**
   * Update counselor volunteer status and session fee
   */
  static async updateCounselorVolunteerStatus(counselorId: number, isVolunteer: boolean, sessionFee: number): Promise<CounselorResponse> {
    if (!counselorId || typeof counselorId !== 'number' || counselorId <= 0) {
      throw new ValidationError('Professional ID is required and must be a positive number');
    }

    if (typeof isVolunteer !== 'boolean') {
      throw new ValidationError('isVolunteer must be a boolean value');
    }

    if (typeof sessionFee !== 'number' || sessionFee < 0) {
      throw new ValidationError('Session fee must be a non-negative number');
    }

    try {
      // First get the user's role to determine which table to update
      const userResult = await sequelize.query(`
        SELECT role FROM users WHERE id = ?
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      if (userResult.length === 0) {
        throw new ItemNotFoundError('User not found');
      }

      const userRole = (userResult[0] as any).role;
      const tableName = userRole === 'Psychiatrist' ? 'psychiatrists' : 'counselors';

      // Find the professional to ensure they exist
      const professional = userRole === 'Psychiatrist' 
        ? await Psychiatrist.findPsychiatristById(counselorId)
        : await Counselor.findCounselorById(counselorId);

      if (!professional) {
        throw new ItemNotFoundError('Professional not found with the provided ID');
      }

      // Update volunteer status and session fee in the database
      await sequelize.query(`
        UPDATE ${tableName}
        SET "isVolunteer" = $1, "sessionFee" = $2, "updatedAt" = NOW()
        WHERE "userId" = $3
      `, {
        bind: [isVolunteer, sessionFee, counselorId],
        type: QueryTypes.UPDATE
      });

      // Update the professional object
      professional.isVolunteer = isVolunteer;
      professional.sessionFee = sessionFee;

      return {
        id: professional.id,
        firebaseId: professional.firebaseId,
        name: professional.name,
        email: professional.email,
        avatar: professional.avatar,
        role: professional.role,
        title: professional.title,
        specialities: professional.specialities,
        address: professional.address,
        contact_no: professional.contact_no,
        license_no: professional.license_no,
        idCard: professional.idCard,
        isVolunteer: isVolunteer,
        isAvailable: professional.isAvailable,
        description: professional.description,
        rating: professional.rating,
        sessionFee: sessionFee,
        status: professional.status,
        coverImage: professional.coverImage,
        instagram: professional.instagram,
        linkedin: professional.linkedin,
        x: professional.x,
        website: professional.website,
        languages: professional.languages
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update professional volunteer status and session fee');
    }
  }

  /**
   * Get counselor earnings summary
   */
  static async getCounselorEarningsSummary(counselorId: number): Promise<{
    totalEarnings: number;
    thisMonth: number;
    lastMonth: number;
    pendingAmount: number;
    totalSessions: number;
    avgPerSession: number;
  }> {
    try {
      // Get current date info
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      const lastMonthNum = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Get total earnings (all sessions with payment)
      const [totalResult] = await sequelize.query(`
        SELECT COALESCE(SUM(price), 0) as total
        FROM sessions
        WHERE "counselorId" = $1 AND price > 0
      `, {
        bind: [counselorId],
        type: QueryTypes.SELECT
      });

      // Get this month's earnings
      const [thisMonthResult] = await sequelize.query(`
        SELECT COALESCE(SUM(price), 0) as total
        FROM sessions
        WHERE "counselorId" = $1 AND price > 0
        AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3
      `, {
        bind: [counselorId, currentYear, currentMonth],
        type: QueryTypes.SELECT
      });

      // Get last month's earnings
      const [lastMonthEarnings] = await sequelize.query(`
        SELECT COALESCE(SUM(price), 0) as total
        FROM sessions
        WHERE "counselorId" = $1 AND price > 0
        AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3
      `, {
        bind: [counselorId, lastMonthYear, lastMonthNum],
        type: QueryTypes.SELECT
      });

      // Get pending amount (scheduled sessions)
      const [pendingResult] = await sequelize.query(`
        SELECT COALESCE(SUM(price), 0) as total
        FROM sessions
        WHERE "counselorId" = $1 AND status = 'scheduled'
      `, {
        bind: [counselorId],
        type: QueryTypes.SELECT
      });

      // Get total sessions count
      const [sessionsResult] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM sessions
        WHERE "counselorId" = $1 AND price > 0
      `, {
        bind: [counselorId],
        type: QueryTypes.SELECT
      });

      const totalEarnings = parseFloat((totalResult as any).total) || 0;
      const thisMonth = parseFloat((thisMonthResult as any).total) || 0;
      const lastMonth = parseFloat((lastMonthEarnings as any).total) || 0;
      const pendingAmount = parseFloat((pendingResult as any).total) || 0;
      const totalSessions = parseInt((sessionsResult as any).count) || 0;
      const avgPerSession = totalSessions > 0 ? Math.round((totalEarnings / totalSessions) * 100) / 100 : 0;

      return {
        totalEarnings,
        thisMonth,
        lastMonth,
        pendingAmount,
        totalSessions,
        avgPerSession
      };
    } catch (error) {
      throw new DatabaseError('Failed to get counselor earnings summary');
    }
  }

  /**
   * Get counselor monthly earnings for specified period
   */
  static async getCounselorMonthlyEarnings(counselorId: number, months: number): Promise<Array<{
    month: string;
    earnings: number;
    sessions: number;
  }>> {
    try {
      const results = await sequelize.query(`
        SELECT
          TO_CHAR(date, 'Mon') as month_name,
          EXTRACT(YEAR FROM date) as year,
          EXTRACT(MONTH FROM date) as month_num,
          COALESCE(SUM(price), 0) as earnings,
          COUNT(*) as sessions
        FROM sessions
        WHERE "counselorId" = $1 AND price > 0
        AND date >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), TO_CHAR(date, 'Mon')
        ORDER BY year DESC, month_num DESC
      `, {
        bind: [counselorId],
        type: QueryTypes.SELECT
      });

      return (results as any[]).map(row => ({
        month: row.month_name,
        earnings: parseFloat(row.earnings) || 0,
        sessions: parseInt(row.sessions) || 0
      }));
    } catch (error) {
      throw new DatabaseError('Failed to get counselor monthly earnings');
    }
  }

  /**
   * Get counselor earnings per client
   */
  static async getCounselorEarningsPerClient(counselorId: number, clientId?: number): Promise<Array<{
    clientId: number;
    clientName: string;
    totalEarnings: number;
    totalSessions: number;
    lastSessionDate: string;
  }>> {
    try {
      let whereClause = 'WHERE u.id IN (SELECT DISTINCT "userId" FROM sessions WHERE "counselorId" = $1 AND price > 0)';
      let bindParams = [counselorId];

      if (clientId) {
        whereClause = 'WHERE u.id = $2 AND u.id IN (SELECT DISTINCT "userId" FROM sessions WHERE "counselorId" = $1 AND price > 0)';
        bindParams = [counselorId, clientId];
      }

      const results = await sequelize.query(`
        SELECT
          u.id as client_id,
          CASE
            WHEN u.role = 'Client' AND c."nickName" IS NOT NULL THEN c."nickName"
            ELSE u.name
          END as client_name,
          COALESCE(SUM(s.price), 0) as total_earnings,
          COUNT(s.id) as total_sessions,
          MAX(s.date) as last_session_date
        FROM users u
        LEFT JOIN clients c ON u.id = c."userId"
        LEFT JOIN sessions s ON u.id = s."userId" AND s."counselorId" = $1 AND s.price > 0
        ${whereClause}
        GROUP BY u.id, u.name, c."nickName"
        ORDER BY total_earnings DESC
      `, {
        bind: bindParams,
        type: QueryTypes.SELECT
      });

      return (results as any[]).map(row => ({
        clientId: row.client_id,
        clientName: row.client_name,
        totalEarnings: parseFloat(row.total_earnings) || 0,
        totalSessions: parseInt(row.total_sessions) || 0,
        lastSessionDate: row.last_session_date || null
      }));
    } catch (error) {
      throw new DatabaseError('Failed to get counselor earnings per client');
    }
  }
}