import Psychiatrist from '../models/Psychiatrist';
import User from '../models/User';

export const getAllPsychiatrists = async () => {
  return await Psychiatrist.findAll({
    attributes: ['id', 'status', 'specialization', 'title', 'phone', 'experience', 'qualifications', 'bio', 'registeredDate', 'category'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email'],
      },
    ],
  });
};

export const getPsychiatristById = async (id: number) => {
  return await Psychiatrist.findByPk(id, {
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
export const updatePsychiatristStatus = async (
  id: number,
  status: 'pending' | 'approved' | 'rejected',
  //comment?: string
) => {
  const psychiatrist = await Psychiatrist.findByPk(id);
  if (!psychiatrist) return null;

  return await psychiatrist.update({
    status,
    //statusComment: comment || null,  // Make sure this column exists in your model/table
  });
};
