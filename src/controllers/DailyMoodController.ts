import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import DailyMood from '../models/DailyMood';
import { Op } from 'sequelize';

// GET /api/users/:id/moods?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export const getUserDailyMoods = asyncHandler(async (req: Request, res: Response) => {
  // Accept either :id or :clientId
  const paramId = (req.params as any).id ?? (req.params as any).clientId;
  const userId = Number(paramId);
  const { startDate, endDate, limit } = req.query as { startDate?: string; endDate?: string; limit?: string };

  if (!userId || Number.isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Valid user id is required' });
  }

  const where: any = { user_id: userId };
  if (startDate && endDate) {
    where.local_date = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.local_date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.local_date = { [Op.lte]: endDate };
  }

  const records = await DailyMood.findAll({
    where,
    order: [['local_date', 'ASC']],
    limit: limit ? Number(limit) : undefined,
  } as any);

  res.json({ success: true, data: records });
});

// POST /api/users/:id/moods  { local_date, valence, arousal, intensity, mood }
// Create-only: mood cannot be updated once set for a given date.
export const createUserDailyMood = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = Number(id);
  const { local_date, valence, arousal, intensity, mood } = req.body as {
    local_date?: string;
    valence?: number;
    arousal?: number;
    intensity?: number;
    mood?: string;
  };

  if (!userId || Number.isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Valid user id is required' });
  }

  // Ensure the authenticated user is only creating their own mood entry
  if (!req.user || req.user.dbUser.id !== userId) {
    return res.status(403).json({ success: false, message: 'You can only submit your own mood' });
  }

  if (!local_date || !/^\d{4}-\d{2}-\d{2}$/.test(local_date)) {
    return res.status(400).json({ success: false, message: 'local_date (YYYY-MM-DD) is required' });
  }

  // Validate valence (-1 to 1)
  if (valence === undefined || valence === null || typeof valence !== 'number' || valence < -1 || valence > 1) {
    return res.status(400).json({ success: false, message: 'valence must be a number between -1 and 1' });
  }

  // Validate arousal (-1 to 1)
  if (arousal === undefined || arousal === null || typeof arousal !== 'number' || arousal < -1 || arousal > 1) {
    return res.status(400).json({ success: false, message: 'arousal must be a number between -1 and 1' });
  }

  // Validate intensity (0 to 1)
  if (intensity === undefined || intensity === null || typeof intensity !== 'number' || intensity < 0 || intensity > 1) {
    return res.status(400).json({ success: false, message: 'intensity must be a number between 0 and 1' });
  }

  // Validate mood (string up to 50 characters)
  if (!mood || typeof mood !== 'string' || mood.trim().length === 0 || mood.length > 50) {
    return res.status(400).json({ success: false, message: 'mood must be a non-empty string with maximum 50 characters' });
  }

  // Check if a mood is already set for this user and date
  const existing = await DailyMood.findOne({ where: { user_id: userId, local_date } as any });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Mood already set for this date and cannot be updated' });
  }

  const record = await DailyMood.create({
    user_id: userId,
    local_date,
    valence,
    arousal,
    intensity,
    mood: mood.trim()
  } as any);

  return res.status(201).json({ success: true, data: record });
});
