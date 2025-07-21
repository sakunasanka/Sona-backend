import Counselor from '../models/Counselor';
import User from '../models/User';

export const getAllCounselors = async () => {
  return await Counselor.findAll({
    attributes: ['id', 'status', 'specialities', 'title', 'phone', 'experience', 'qualifications', 'bio', 'registeredDate', 'category'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email'],
      },
    ],
  });
};

export const getCounselorById = async (id: number) => {
  return await Counselor.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email'],
      },
    ],
  });
};

// Update status and optional comment, accept 'pending', 'approved', 'rejected'
export const updateCounselorStatus = async (
  id: number,
  status: 'pending' | 'approved' | 'rejected',
  //comment?: string
) => {
  const counselor = await Counselor.findByPk(id);
  if (!counselor) return null;

  return await counselor.update({
    status,
    //statusComment: comment || null,  // Make sure this column exists in your model/table
  });
};
