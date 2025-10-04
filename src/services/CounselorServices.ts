import { ValidationError, ItemNotFoundError, DatabaseError } from '../utils/errors';
import Counselor from '../models/Counselor';
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
      const counselors = await Counselor.findAllAvailableCounselors();
      return counselors.map(counselor => ({
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
        isAvailable: counselor.isAvailable,
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

    const counselor = await Counselor.findCounselorById(id);
    
    if (!counselor) {
      throw new ItemNotFoundError('Counselor not found with the provided ID');
    }
    
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
      isAvailable: counselor.isAvailable,
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
      const profile = await sequelize.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar,
          c.title,
          c.specialities,
          c.description,
          c.rating,
          c."isAvailable",
          c.address,
          c.contact_no as phone,
          c."sessionFee"
        FROM users u
        JOIN counselors c ON u.id = c."userId"
        WHERE u.id = ? AND u.role = 'Counselor'
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      if (profile.length === 0) {
        throw new ItemNotFoundError('Counselor profile not found');
      }

      return {
        success: true,
        message: "Profile retrieved successfully",
        data: profile[0]
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      console.error('Error fetching counselor profile:', error);
      throw new DatabaseError('Failed to fetch counselor profile');
    }
  }

  /**
   * Get detailed counselor profile for profile page
   */
  static async getCounselorDetailedProfile(counselorId: number) {
    try {
      const profile = await sequelize.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar,
          c.title,
          c.specialities as specializations,
          c.description as bio,
          c.rating,
          c."isAvailable",
          c."isVolunteer",
          c.address,
          c.contact_no as phone,
          c."sessionFee",
          c."createdAt" as "joinDate",
          c."updatedAt" as "lastActiveAt",
          c."coverImage",
          c.instagram,
          c.linkedin,
          c.x,
          c.website,
          c.languages
        FROM users u
        JOIN counselors c ON u.id = c."userId"
        WHERE u.id = ?
      `, {
        replacements: [counselorId],
        type: QueryTypes.SELECT
      });

      if (profile.length === 0) {
        throw new ItemNotFoundError('Counselor profile not found');
      }

      const counselorData = profile[0] as any;

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
      const fullName = counselorData.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: counselorData.id,
        firstName,
        lastName,
        profileImage: counselorData.avatar || '/assets/images/default-avatar.png',
        coverImage: counselorData.coverImage || '/assets/images/counsellor-banner.jpg',
        bio: counselorData.bio || 'Passionate mental health counselor dedicated to helping individuals achieve their wellness goals.',
        location: counselorData.address || 'Colombo, Sri Lanka',
        website: counselorData.website || null,
        email: counselorData.email,
        phone: counselorData.phone || '(071) 123-4567',
        joinDate: new Date(counselorData.joinDate).toISOString(),
        specializations: Array.isArray(counselorData.specializations) 
          ? counselorData.specializations 
          : (counselorData.specializations ? [counselorData.specializations] : ["Anxiety Disorders", "Depression", "Trauma Therapy"]),
        languages: counselorData.languages || ['English', 'Sinhala', 'Tamil'],
        experience: new Date().getFullYear() - new Date(counselorData.joinDate).getFullYear() || 8,
        rating: parseFloat(counselorData.rating) || 4.9,
        totalReviews: 127, // Can be enhanced with reviews table
        totalSessions: parseInt(totalSessions),
        totalClients: parseInt(totalClients),
        status: counselorData.isAvailable ? 'available' : 'unavailable',
        lastActiveAt: new Date(counselorData.lastActiveAt).toISOString(),
        socialLinks: {
          instagram: counselorData.instagram || null,
          linkedin: counselorData.linkedin || null,
          x: counselorData.x || null
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
        // Update user table
        if (updateData.firstName || updateData.lastName || updateData.email || updateData.avatar) {
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

        // Update counselor table
        const counselorFields = [
          'bio', 'specializations', 'phone', 'location', 'coverImage', 'instagram', 'linkedin', 'x', 'website', 'languages'
        ];
        
        const hasUpdateFields = counselorFields.some(field => updateData[field] !== undefined);
        
        if (hasUpdateFields) {
          await sequelize.query(`
            UPDATE counselors 
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
      console.error('Error updating counselor profile:', error);
      throw new DatabaseError('Failed to update counselor profile');
    }
  }
} 