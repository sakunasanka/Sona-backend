import express from 'express';
import {
  getAllPsychiatrists,
  updatePsychiatristStatusHandler
} from '../controllers/AdminPsychiatristController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

router.get('/', authenticateToken, getAllPsychiatrists);
router.put('/:id/status', authenticateToken, updatePsychiatristStatusHandler);

export default router;
