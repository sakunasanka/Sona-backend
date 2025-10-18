import { Request, Response } from 'express';
import AdminProfileService from '../services/AdminProfileServices';
import { ValidationError } from '../utils/errors';

class AdminProfileController {
  // Get admin profile
  public getAdminProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.dbUser.id;
      
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const adminProfile = await AdminProfileService.getAdminProfile(userId);
      
      res.status(200).json({
        success: true,
        data: adminProfile
      });
    } catch (error) {
      console.error('Get admin profile error:', error);
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch admin profile'
        });
      }
    }
  };

  // Update admin profile
  public updateAdminProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.dbUser.id;
      const updateData = req.body;

      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const updatedProfile = await AdminProfileService.updateAdminProfile(userId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Update admin profile error:', error);
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update admin profile'
        });
      }
    }
  };

  // Update profile picture
  public updateProfilePicture = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.dbUser.id;
      const { profilePicture } = req.body;

      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      if (!profilePicture) {
        throw new ValidationError('Profile picture is required');
      }

      const updatedProfile = await AdminProfileService.updateProfilePicture(userId, profilePicture);
      
      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Update profile picture error:', error);
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update profile picture'
        });
      }
    }
  };
}

export default new AdminProfileController();