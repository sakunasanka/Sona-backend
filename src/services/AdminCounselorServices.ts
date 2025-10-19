import Counselor from '../models/Counselor';
import User from '../models/User';
import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

interface CounselorCounts {
  pending: number;
  approved: number;
  rejected: number;
  unset: number;
  [key: string]: number;
}

interface EducationQualification {
  id: number;
  userId: number;
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  document?: string;
  title?: string;
  year?: number;
  status: 'pending' | 'approved' | 'rejected';
  proof?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Experience {
  id: number;
  userId: number;
  position: string;
  company: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  proof?: string;
  document?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CounselorWithRejectionInfo {
  id: number;
  firebaseId?: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  title?: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'unset';
  coverImage?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
  website?: string;
  languages?: string[];
  eduQualifications: EducationQualification[];
  experiences: Experience[];
  createdAt: string;
  updatedAt: string;
  // Rejection information
  rejectionReason?: string;
  rejectedBy?: number;
  rejectedByName?: string;
  rejectedByRole?: string;
}

export const getAllCounselors = async (
  status?: 'pending' | 'approved' | 'rejected' | 'unset',
  searchTerm?: string
): Promise<CounselorWithRejectionInfo[]> => {
  try {
    let whereConditions = ['u.role = \'Counselor\''];
    const replacements: any = {};

    if (status) {
      whereConditions.push('c.status = :status');
      replacements.status = status;
    }

    if (searchTerm) {
      whereConditions.push(`(
        u.name ILIKE :search OR 
        u.email ILIKE :search OR 
        c.specialities::text ILIKE :search OR
        c.title ILIKE :search OR
        EXISTS (
          SELECT 1 FROM edu_qualifications eq 
          WHERE eq."userId" = u.id AND (
            eq.institution ILIKE :search OR 
            eq.degree ILIKE :search OR 
            eq.field ILIKE :search OR 
            eq.title ILIKE :search
          )
        ) OR
        EXISTS (
          SELECT 1 FROM experiences exp 
          WHERE exp."userId" = u.id AND (
            exp.position ILIKE :search OR 
            exp.company ILIKE :search OR 
            exp.title ILIKE :search OR 
            exp.description ILIKE :search
          )
        )
      )`);
      replacements.search = `%${searchTerm}%`;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main query to get counselors with rejection information
    const counselors = await sequelize.query(`
      SELECT 
        u.id,
        u."firebaseId",
        u.name,
        u.email,
        u.avatar,
        u.role,
        u."createdAt" as "userCreatedAt",
        u."updatedAt" as "userUpdatedAt",
        c."userId",
        c.title,
        c.specialities,
        c.address,
        c.contact_no,
        c."licenseNo" as license_no,
        c."idCard",
        c."isVolunteer",
        c."isAvailable",
        c.description,
        c.rating,
        c."sessionFee",
        c.status,
        c."coverImage",
        c.instagram,
        c.linkedin,
        c.x,
        c.website,
        c.languages,
        c."createdAt" as "counselorCreatedAt",
        c."updatedAt" as "counselorUpdatedAt",
        rr.reason as "rejectionReason",
        rr."rejectedBy",
        admin_user.name as "rejectedByName",
        admin_user.role as "rejectedByRole"
      FROM users u
      INNER JOIN counselors c ON u.id = c."userId"
      LEFT JOIN rejection_reasons rr ON u.id = rr."userId"
      LEFT JOIN users admin_user ON rr."rejectedBy" = admin_user.id
      ${whereClause}
      ORDER BY c."createdAt" DESC
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Get education qualifications and experiences for all counselors
    const counselorIds = counselors.map((c: any) => c.id);
    
    let eduQualifications: EducationQualification[] = [];
    let experiences: Experience[] = [];

    if (counselorIds.length > 0) {
      // Get education qualifications
      eduQualifications = await sequelize.query(`
        SELECT 
          id,
          "userId",
          institution,
          degree,
          field,
          "startDate",
          "endDate",
          grade,
          document,
          title,
          year,
          status,
          proof,
          "approvedAt",
          "createdAt",
          "updatedAt"
        FROM edu_qualifications 
        WHERE "userId" IN (${counselorIds.join(',')})
        ORDER BY "createdAt" DESC
      `, {
        type: QueryTypes.SELECT
      }) as EducationQualification[];

      // Get experiences
      experiences = await sequelize.query(`
        SELECT 
          id,
          "userId",
          position,
          company,
          title,
          description,
          "startDate",
          "endDate",
          status,
          proof,
          document,
          "approvedAt",
          "createdAt",
          "updatedAt"
        FROM experiences 
        WHERE "userId" IN (${counselorIds.join(',')})
        ORDER BY "createdAt" DESC
      `, {
        type: QueryTypes.SELECT
      }) as Experience[];
    }

    // Transform the data
    const transformedCounselors = counselors.map((counselor: any) => {
      const counselorEduQualifications = eduQualifications.filter(edu => edu.userId === counselor.id);
      const counselorExperiences = experiences.filter(exp => exp.userId === counselor.id);

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
        languages: counselor.languages,
        eduQualifications: counselorEduQualifications,
        experiences: counselorExperiences,
        createdAt: counselor.userCreatedAt || counselor.counselorCreatedAt,
        updatedAt: counselor.userUpdatedAt || counselor.counselorUpdatedAt,
        // Rejection information
        rejectionReason: counselor.rejectionReason,
        rejectedBy: counselor.rejectedBy,
        rejectedByName: counselor.rejectedByName,
        rejectedByRole: counselor.rejectedByRole
      };
    });

    return transformedCounselors;
  } catch (error) {
    console.error('Error in getAllCounselors:', error);
    throw error;
  }
};

export const getCounselorById = async (userId: number): Promise<CounselorWithRejectionInfo | null> => {
  try {
    // Get counselor basic info with rejection information
    const counselors = await sequelize.query(`
      SELECT 
        u.id,
        u."firebaseId",
        u.name,
        u.email,
        u.avatar,
        u.role,
        u."createdAt" as "userCreatedAt",
        u."updatedAt" as "userUpdatedAt",
        c."userId",
        c.title,
        c.specialities,
        c.address,
        c.contact_no,
        c."licenseNo" as license_no,
        c."idCard",
        c."isVolunteer",
        c."isAvailable",
        c.description,
        c.rating,
        c."sessionFee",
        c.status,
        c."coverImage",
        c.instagram,
        c.linkedin,
        c.x,
        c.website,
        c.languages,
        c."createdAt" as "counselorCreatedAt",
        c."updatedAt" as "counselorUpdatedAt",
        rr.reason as "rejectionReason",
        rr."rejectedBy",
        admin_user.name as "rejectedByName",
        admin_user.role as "rejectedByRole"
      FROM users u
      INNER JOIN counselors c ON u.id = c."userId"
      LEFT JOIN rejection_reasons rr ON u.id = rr."userId"
      LEFT JOIN users admin_user ON rr."rejectedBy" = admin_user.id
      WHERE u.id = :userId AND u.role = 'Counselor'
    `, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    if (counselors.length === 0) {
      return null;
    }

    const counselor = counselors[0] as any;

    // Get education qualifications for this counselor
    const eduQualifications = await sequelize.query(`
      SELECT 
        id,
        "userId",
        institution,
        degree,
        field,
        "startDate",
        "endDate",
        grade,
        document,
        title,
        year,
        status,
        proof,
        "approvedAt",
        "createdAt",
        "updatedAt"
      FROM edu_qualifications 
      WHERE "userId" = :userId
      ORDER BY "createdAt" DESC
    `, {
      replacements: { userId },
      type: QueryTypes.SELECT
    }) as EducationQualification[];

    // Get experiences for this counselor
    const experiences = await sequelize.query(`
      SELECT 
        id,
        "userId",
        position,
        company,
        title,
        description,
        "startDate",
        "endDate",
        status,
        proof,
        document,
        "approvedAt",
        "createdAt",
        "updatedAt"
      FROM experiences 
      WHERE "userId" = :userId
      ORDER BY "createdAt" DESC
    `, {
      replacements: { userId },
      type: QueryTypes.SELECT
    }) as Experience[];

    // Transform the data
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
      languages: counselor.languages,
      eduQualifications: eduQualifications,
      experiences: experiences,
      createdAt: counselor.userCreatedAt || counselor.counselorCreatedAt,
      updatedAt: counselor.userUpdatedAt || counselor.counselorUpdatedAt,
      // Rejection information
      rejectionReason: counselor.rejectionReason,
      rejectedBy: counselor.rejectedBy,
      rejectedByName: counselor.rejectedByName,
      rejectedByRole: counselor.rejectedByRole
    };
  } catch (error) {
    console.error('Error in getCounselorById:', error);
    throw error;
  }
};

export const updateCounselorStatus = async (
  userId: number,
  status: 'pending' | 'approved' | 'rejected' | 'unset',
  rejectionReason?: string,
  rejectedById?: number
): Promise<CounselorWithRejectionInfo | null> => {
  const transaction = await sequelize.transaction();
  
  try {
    const counselor = await Counselor.findOne({ 
      where: { userId },
      transaction
    });
    
    if (!counselor) {
      await transaction.rollback();
      return null;
    }

    // Update counselor status
    await counselor.update({
      status,
      ...(status === 'rejected' && rejectionReason && { rejectionReason })
    }, { transaction });

    // Handle rejection - store in rejection_reasons table
    if (status === 'rejected' && rejectionReason) {
      if (!rejectedById) {
        throw new Error('rejectedById is required when rejecting a counselor');
      }

      // First, delete any existing rejection reason for this user
      await sequelize.query(
        `DELETE FROM rejection_reasons WHERE "userId" = :userId`,
        {
          replacements: { userId },
          type: QueryTypes.DELETE,
          transaction,
        }
      );

      // Insert new rejection reason with rejectedBy information
      await sequelize.query(
        `INSERT INTO rejection_reasons ("userId", reason, "rejectedBy", "createdAt")
         VALUES (:userId, :reason, :rejectedBy, NOW())`,
        {
          replacements: {
            userId,
            reason: rejectionReason,
            rejectedBy: rejectedById,
          },
          type: QueryTypes.INSERT,
          transaction,
        }
      );
    } else if (status !== 'rejected') {
      // Remove rejection reason if status is changed from rejected to something else
      await sequelize.query(
        `DELETE FROM rejection_reasons WHERE "userId" = :userId`,
        {
          replacements: { userId },
          type: QueryTypes.DELETE,
          transaction,
        }
      );
    }

    await transaction.commit();
    
    // Return the updated counselor with all relationships and rejection info
    return await getCounselorById(userId);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateCounselorStatus:', error);
    throw error;
  }
};

export const getCounselorCounts = async (): Promise<CounselorCounts & { totalCounselors: number }> => {
  const counselors = await Counselor.findAll({
    attributes: ['userId', 'status']
  });

  const initialCounts: CounselorCounts & { totalCounselors: number } = {
    pending: 0,
    approved: 0,
    rejected: 0,
    unset: 0,
    totalCounselors: 0
  };

  return counselors.reduce((acc, c) => {
    const status = (c.status || 'unset').toLowerCase() as keyof CounselorCounts;
    acc[status] = (acc[status] || 0) + 1;
    acc.totalCounselors += 1;
    return acc;
  }, initialCounts);
};