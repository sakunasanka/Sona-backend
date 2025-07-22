import { Request, Response } from 'express';
import Psychiatrist from '../models/Psychiatrist';
import User from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { updatePsychiatristStatus } from '../services/AdminPsychiatristServices';

// Get all psychiatrists
export const getAllPsychiatrists = asyncHandler(async (req: Request, res: Response) => {
  const psychiatrists = await Psychiatrist.findAll({
    attributes: ['userId', 'status', 'specialization'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email'],
      },
    ],
  });

  res.status(200).json({ data: psychiatrists });
});

// Update status handler
export const updatePsychiatristStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status/*, comment*/ } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const updatedPsychiatrist = await updatePsychiatristStatus(Number(id), status/*, comment*/);

  if (!updatedPsychiatrist) {
    return res.status(404).json({ message: 'Psychiatrist not found' });
  }

  res.status(200).json({ message: 'Status updated successfully', data: updatedPsychiatrist });
});
