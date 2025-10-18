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

export const getAllCounselors = async (
  status?: 'pending' | 'approved' | 'rejected' | 'unset',
  searchTerm?: string
) => {
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

    // Main query to get counselors
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
        c."updatedAt" as "counselorUpdatedAt"
      FROM users u
      INNER JOIN counselors c ON u.id = c."userId"
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
        updatedAt: counselor.userUpdatedAt || counselor.counselorUpdatedAt
      };
    });

    return transformedCounselors;
  } catch (error) {
    console.error('Error in getAllCounselors:', error);
    throw error;
  }
};

export const getCounselorById = async (userId: number) => {
  try {
    // Get counselor basic info
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
        c."updatedAt" as "counselorUpdatedAt"
      FROM users u
      INNER JOIN counselors c ON u.id = c."userId"
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
      updatedAt: counselor.userUpdatedAt || counselor.counselorUpdatedAt
    };
  } catch (error) {
    console.error('Error in getCounselorById:', error);
    throw error;
  }
};

export const updateCounselorStatus = async (
  userId: number,
  status: 'pending' | 'approved' | 'rejected' | 'unset',
  rejectionReason?: string
) => {
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

    await counselor.update({
      status,
      ...(status === 'rejected' && rejectionReason && { rejectionReason })
    }, { transaction });

    if (status === 'rejected' && rejectionReason) {
      await sequelize.query(
        `INSERT INTO rejection_reasons ("userId", reason, "createdAt")
         VALUES (:userId, :reason, NOW())`,
        {
          replacements: {
            userId,
            reason: rejectionReason,
          },
          type: QueryTypes.INSERT,
          transaction,
        }
      );
    }

    await transaction.commit();
    
    // Return the updated counselor with all relationships
    return await getCounselorById(userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getCounselorCounts = async (): Promise<CounselorCounts> => {
  const counselors = await Counselor.findAll({
    attributes: ['userId', 'status']
  });

  const initialCounts: CounselorCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    unset: 0
  };

  return counselors.reduce((acc, c) => {
    const status = (c.status || 'unset').toLowerCase() as keyof CounselorCounts;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, initialCounts);
};