import { Request, Response } from 'express';
import Psychiatrist from '../models/Psychiatrist';
import { validationResult } from 'express-validator';

class AdminPsychiatristController {
  // Get all psychiatrists
  async getAllPsychiatrists(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      
      let psychiatrists = await Psychiatrist.findAllPsychiatrists();

      // Filter by status if provided and not 'unset'
      if (status && status !== 'unset') {
        psychiatrists = psychiatrists.filter(psych => psych.status === status);
      }

      // Filter by search term if provided
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        psychiatrists = psychiatrists.filter(psych => 
          psych.name.toLowerCase().includes(searchTerm) ||
          psych.email.toLowerCase().includes(searchTerm) ||
          psych.title?.toLowerCase().includes(searchTerm) ||
          psych.specialities?.some(spec => spec.toLowerCase().includes(searchTerm)) ||
          psych.license_no?.toLowerCase().includes(searchTerm) ||
          psych.contact_no?.toLowerCase().includes(searchTerm) ||
          psych.address?.toLowerCase().includes(searchTerm) ||
          psych.description?.toLowerCase().includes(searchTerm) ||
          psych.languages?.some(lang => lang.toLowerCase().includes(searchTerm))
        );
      }

      // Return all fields from the model
      const response = psychiatrists.map(psych => ({
        id: psych.id,
        firebaseId: psych.firebaseId,
        name: psych.name,
        email: psych.email,
        avatar: psych.avatar,
        role: psych.role,
        title: psych.title,
        specialities: psych.specialities,
        address: psych.address,
        contact_no: psych.contact_no,
        license_no: psych.license_no,
        idCard: psych.idCard,
        isVolunteer: psych.isVolunteer,
        isAvailable: psych.isAvailable,
        description: psych.description,
        rating: psych.rating,
        sessionFee: psych.sessionFee,
        status: psych.status,
        coverImage: psych.coverImage,
        instagram: psych.instagram,
        linkedin: psych.linkedin,
        x: psych.x,
        website: psych.website,
        languages: psych.languages,
        createdAt: psych.createdAt,
        updatedAt: psych.updatedAt
      }));

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching psychiatrists:', error);
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
      const psychiatrist = await Psychiatrist.findPsychiatristById(parseInt(id));

      if (!psychiatrist) {
        return res.status(404).json({ message: 'Psychiatrist not found' });
      }

      // Return all fields from the model
      const response = {
        id: psychiatrist.id,
        firebaseId: psychiatrist.firebaseId,
        name: psychiatrist.name,
        email: psychiatrist.email,
        avatar: psychiatrist.avatar,
        role: psychiatrist.role,
        title: psychiatrist.title,
        specialities: psychiatrist.specialities,
        address: psychiatrist.address,
        contact_no: psychiatrist.contact_no,
        license_no: psychiatrist.license_no,
        idCard: psychiatrist.idCard,
        isVolunteer: psychiatrist.isVolunteer,
        isAvailable: psychiatrist.isAvailable,
        description: psychiatrist.description,
        rating: psychiatrist.rating,
        sessionFee: psychiatrist.sessionFee,
        status: psychiatrist.status,
        coverImage: psychiatrist.coverImage,
        instagram: psychiatrist.instagram,
        linkedin: psychiatrist.linkedin,
        x: psychiatrist.x,
        website: psychiatrist.website,
        languages: psychiatrist.languages,
        createdAt: psychiatrist.createdAt,
        updatedAt: psychiatrist.updatedAt
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching psychiatrist by ID:', error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
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

      // Update the psychiatrist status using the model method
      const updatedPsychiatrist = await Psychiatrist.updatePsychiatristStatus(
        parseInt(id),
        status
      );

      if (!updatedPsychiatrist) {
        return res.status(404).json({ message: 'Psychiatrist not found' });
      }

      // Return all fields from the model
      const response = {
        id: updatedPsychiatrist.id,
        firebaseId: updatedPsychiatrist.firebaseId,
        name: updatedPsychiatrist.name,
        email: updatedPsychiatrist.email,
        avatar: updatedPsychiatrist.avatar,
        role: updatedPsychiatrist.role,
        title: updatedPsychiatrist.title,
        specialities: updatedPsychiatrist.specialities,
        address: updatedPsychiatrist.address,
        contact_no: updatedPsychiatrist.contact_no,
        license_no: updatedPsychiatrist.license_no,
        idCard: updatedPsychiatrist.idCard,
        isVolunteer: updatedPsychiatrist.isVolunteer,
        isAvailable: updatedPsychiatrist.isAvailable,
        description: updatedPsychiatrist.description,
        rating: updatedPsychiatrist.rating,
        sessionFee: updatedPsychiatrist.sessionFee,
        status: updatedPsychiatrist.status,
        coverImage: updatedPsychiatrist.coverImage,
        instagram: updatedPsychiatrist.instagram,
        linkedin: updatedPsychiatrist.linkedin,
        x: updatedPsychiatrist.x,
        website: updatedPsychiatrist.website,
        languages: updatedPsychiatrist.languages,
        createdAt: updatedPsychiatrist.createdAt,
        updatedAt: updatedPsychiatrist.updatedAt,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error updating psychiatrist status:', error);
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
      const allPsychiatrists = await Psychiatrist.findAllPsychiatrists();
      
      const counts = {
        total: allPsychiatrists.length,
        pending: allPsychiatrists.filter(p => p.status === 'pending').length,
        approved: allPsychiatrists.filter(p => p.status === 'approved').length,
        rejected: allPsychiatrists.filter(p => p.status === 'rejected').length,
        available: allPsychiatrists.filter(p => p.isAvailable === true).length,
        unavailable: allPsychiatrists.filter(p => p.isAvailable === false).length,
        volunteers: allPsychiatrists.filter(p => p.isVolunteer === true).length
      };

      res.status(200).json(counts);
    } catch (error) {
      console.error('Error fetching psychiatrist counts:', error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }
}

export default new AdminPsychiatristController();