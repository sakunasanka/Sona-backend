import { Request, Response } from 'express';
import { 
  getAllCounselors,
  getCounselorById,
  updateCounselorStatus,
  getCounselorCounts
} from '../services/AdminCounselorServices';
import { validationResult } from 'express-validator';
import { NotificationHelper } from '../utils/NotificationHelper';

class AdminCounselorController {
  // Get all counselors
  async getAllCounselors(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      
      const counselors = await getAllCounselors(
        status as 'pending' | 'approved' | 'rejected' | 'unset' | undefined,
        search as string | undefined
      );

      res.status(200).json(counselors);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // Get counselor by ID
  async getCounselorById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const counselor = await getCounselorById(parseInt(id));

      if (!counselor) {
        return res.status(404).json({ message: 'Counselor not found' });
      }

      res.status(200).json(counselor);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // Update Counselor status
  async updateCounselorStatus(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      // Validate that rejection reason is provided when status is 'rejected'
      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ 
          message: 'Rejection reason is required when status is rejected' 
        });
      }

      // Get the current admin user ID from the authenticated request
      const rejectedById = req.user?.dbUser.id;

      if (status === 'rejected' && !rejectedById) {
        return res.status(401).json({ 
          message: 'Authentication required for rejection' 
        });
      }

      const updatedCounselor = await updateCounselorStatus(
        parseInt(id),
        status,
        rejectionReason,
        rejectedById // Pass the admin user ID
      );

      if (!updatedCounselor) {
        return res.status(404).json({ message: 'Counselor not found' });
      }

      // Send notification to counselor
      try {
        if (status === 'approved') {
          await NotificationHelper.profileApproved(parseInt(id), 'Counselor');
        } else if (status === 'rejected') {
          await NotificationHelper.profileRejected(parseInt(id), 'Counselor', rejectionReason);
        }
      } catch (notificationError) {
        console.error('Failed to send counselor status notification:', notificationError);
        // Don't fail the status update if notification fails
      }

      res.status(200).json(updatedCounselor);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // New method to revoke counselor status
  async revokeCounselorStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get the current admin user ID from the authenticated request
      const revokedById = req.user?.dbUser.id;

      if (!revokedById) {
        return res.status(401).json({ 
          message: 'Authentication required for revocation' 
        });
      }

      const updatedCounselor = await updateCounselorStatus(
        parseInt(id),
        'pending', // Reset status to pending
        undefined, // No rejection reason for revocation
        revokedById // Pass the admin user ID
      );

      if (!updatedCounselor) {
        return res.status(404).json({ message: 'Counselor not found' });
      }

      res.status(200).json({
        ...updatedCounselor,
        message: 'Counselor status revoked successfully. Status reset to pending.'
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // Get counselor counts
  async getCounselorCounts(req: Request, res: Response) {
    try {
      const counts = await getCounselorCounts();
      res.status(200).json(counts);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }
}

export default new AdminCounselorController();