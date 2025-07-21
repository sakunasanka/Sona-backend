import { Request, Response } from 'express';
import Counselor from '../models/Counselor';
import User from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { updateCounselorStatus } from '../services/AdminCounselorServices';

// Get all counselors
export const getAllCounselors = asyncHandler(async (req: Request, res: Response) => {
  const counselors = await Counselor.findAll({
    attributes: ['userId', 'status', 'specialities', 'title'],
    include: [
      {
        model: User,
        as: 'user', 
        attributes: ['name', 'email'],
      },
    ],
  });

  res.status(200).json({ data: counselors });
});


// Update status handler
export const updateCounselorStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status/*, comment*/ } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const updatedCounselor = await updateCounselorStatus(Number(id), status/*, comment*/);

  if (!updatedCounselor) {
    return res.status(404).json({ message: 'Counselor not found' });
  }

  res.status(200).json({ message: 'Status updated successfully', data: updatedCounselor });
});