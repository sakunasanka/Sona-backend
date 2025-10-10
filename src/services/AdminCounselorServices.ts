import Counselor from '../models/Counselor';
import User from '../models/User';
import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

interface CounselorCounts {
  pending: number;
  approved: number;
  rejected: number;
  unset: number;
  [key: string]: number; // Index signature to allow dynamic access
}

export const getAllCounselors = async (
  status?: 'pending' | 'approved' | 'rejected' | 'unset',
  searchTerm?: string
) => {
  const whereClause: any = {};
  const userWhereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (searchTerm) {
    userWhereClause.name = { $like: `%${searchTerm}%` };
    userWhereClause.email = { $like: `%${searchTerm}%` };
  }

  const counselors = await Counselor.findAll({
    attributes: [
      'userId',
      'specialities',
      'address',
      'contact_no',
      'licenseNo',
      'idCard',
      'isAvailable',
      'description',
      'status',
      'createdAt'
    ],
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        where: userWhereClause,
        attributes: ['name', 'email', 'avatar']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    return counselors.filter(c => {
      const user = c.get('user') as { name: string; email: string } | null;
      if (!user) return false;
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });
  }

  return counselors;
};

export const getCounselorById = async (userId: number) => {
  return await Counselor.findOne({
    where: { userId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'avatar']
      }
    ]
  });
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

    const updatedCounselor = await counselor.update({
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
    return updatedCounselor;
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