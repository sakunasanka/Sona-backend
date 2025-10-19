import { Router } from 'express';
import AdminProfileController from '../controllers/AdminProfileController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get admin profile
router.get('/profile', AdminProfileController.getAdminProfile);

// Update admin profile
router.put('/profile', AdminProfileController.updateAdminProfile);

// Update profile picture
router.put('/profile/picture', AdminProfileController.updateProfilePicture);

export default router;