import { Router } from 'express';
import mtMemberController from '../controllers/AdminMTMemberController';
import { body } from 'express-validator';

const router = Router();

// Validation middleware
const validateMemberData = [
  body('name').notEmpty().withMessage('Name is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('joinDate').isDate().withMessage('Valid join date is required'),
];

// Create a new team member
router.post('/', validateMemberData, mtMemberController.createMember);

// Get all team members with optional filtering
router.get('/', mtMemberController.getAllMembers);

// Get a single team member by ID
router.get('/:id', mtMemberController.getMemberById);

// Update a team member
router.put('/:id', mtMemberController.updateMember);

// Reject a team member
router.post('/:id/reject', mtMemberController.rejectMember);

// Delete a team member
router.delete('/:id', mtMemberController.deleteMember);

// Get unique departments
router.get('/departments/list', mtMemberController.getDepartments);

export default router;