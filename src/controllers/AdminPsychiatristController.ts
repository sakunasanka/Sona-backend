import { Request, Response } from 'express';
import { 
  getAllPsychiatrists,
  getPsychiatristById,
  updatePsychiatristStatus,
  getPsychiatristCounts
} from '../services/AdminPsychiatristServices';
import { validationResult } from 'express-validator';

class AdminPsychiatristController {
  // Get all psychiatrists
  async getAllPsychiatrists(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      
      const psychiatrists = await getAllPsychiatrists(
        status as 'pending' | 'approved' | 'rejected' | 'unset' | undefined,
        search as string | undefined
      );

      res.status(200).json(psychiatrists);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // Get psychiatrist by ID
  async getPsychiatristById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const psychiatrist = await getPsychiatristById(parseInt(id));

      res.status(200).json(psychiatrist);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Psychiatrist not found') {
          res.status(404).json({ message: error.message });
        } else {
          res.status(500).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // Update psychiatrist status
  async updatePsychiatristStatus(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // Validate that rejection reason is provided when status is 'rejected'
    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required when status is rejected' });
    }

    const updatedPsychiatrist = await updatePsychiatristStatus(
      parseInt(id),
      status,
      rejectionReason
    );

    if (!updatedPsychiatrist) {
      return res.status(404).json({ message: 'Psychiatrist not found' });
    }

    res.status(200).json(updatedPsychiatrist);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}

  // Get psychiatrist counts
  async getPsychiatristCounts(req: Request, res: Response) {
    try {
      const counts = await getPsychiatristCounts();
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

export default new AdminPsychiatristController();