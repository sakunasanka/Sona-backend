import express from 'express';
import {
  createMTMember,
  getMTMembers,
  getMTMemberById,
  updateMTMember,
  deleteMTMember
} from '../controllers/AdminMTMemberController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new MT Member
router.post('/', createMTMember);

// Get all MT Members with optional filtering
router.get('/', getMTMembers);

// Get a specific MT Member by ID
router.get('/:id', getMTMemberById);

// Update an MT Member
router.put('/:id', updateMTMember);

// Delete an MT Member
router.delete('/:id', deleteMTMember);

export default router;