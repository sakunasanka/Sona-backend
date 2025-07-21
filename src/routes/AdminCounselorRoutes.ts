import express from 'express';
import {
  getAllCounselors,
  updateCounselorStatusHandler
} from '../controllers/AdminCounselorController';
import { authenticateToken } from '../middlewares/auth';
const router = express.Router();

router.get('/', authenticateToken, getAllCounselors);
router.put('/:id/status', authenticateToken, updateCounselorStatusHandler);

export default router;
