import Psychiatrist from '../models/Psychiatrist';
import User from '../models/User';
import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

interface PsychiatristCounts {
  pending: number;
  approved: number;
  rejected: number;
  unset: number;
  [key: string]: number; // Index signature to allow dynamic access
}

export const getAllPsychiatrists = async (
  status?: 'pending' | 'approved' | 'rejected' | 'unset',
  searchTerm?: string
) => {
  const whereClause: any = {};
  const userWhereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (searchTerm) {
    // Using basic case-sensitive like (can be made case-insensitive in application code)
    userWhereClause.name = { $like: `%${searchTerm}%` };
    userWhereClause.email = { $like: `%${searchTerm}%` };
  }

  const psychiatrists = await Psychiatrist.findAll({
    attributes: [
      'userId',
      'specialization',
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

  // Manual filtering if needed (with proper typing)
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    return psychiatrists.filter(p => {
      const user = p.get('user') as { name: string; email: string } | null;
      if (!user) return false;
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });
  }

  return psychiatrists;
};

export const getPsychiatristById = async (userId: number) => {
  return await Psychiatrist.findOne({
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

export const updatePsychiatristStatus = async (
  userId: number,
  status: 'pending' | 'approved' | 'rejected' | 'unset',
  rejectionReason?: string
) => {
  const transaction = await sequelize.transaction();
  
  try {
    const psychiatrist = await Psychiatrist.findOne({ 
      where: { userId },
      transaction
    });
    
    if (!psychiatrist) {
      await transaction.rollback();
      return null;
    }

    // Update psychiatrist status
    const updatedPsychiatrist = await psychiatrist.update({
      status,
      ...(status === 'rejected' && rejectionReason && { rejectionReason })
    }, { transaction });

    // If rejected, create rejection reason record
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
    return updatedPsychiatrist;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getPsychiatristCounts = async (): Promise<PsychiatristCounts> => {
  const psychiatrists = await Psychiatrist.findAll({
    attributes: ['userId', 'status']
  });

  const initialCounts: PsychiatristCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    unset: 0
  };

  return psychiatrists.reduce((acc, p) => {
    const status = (p.status || 'unset').toLowerCase() as keyof PsychiatristCounts;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, initialCounts);
};