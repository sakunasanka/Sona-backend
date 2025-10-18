import { Request, Response } from 'express';
import Psychiatrist from '../models/Psychiatrist';
import { validationResult } from 'express-validator';

class AdminPsychiatristController {
  // Get all psychiatrists
  async getAllPsychiatrists(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      
      let psychiatrists = await Psychiatrist.findAllPsychiatristsForAdmin();

      if (status && status !== 'unset') {
        psychiatrists = psychiatrists.filter(psych => psych.status === status);
      }

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
          psych.languages?.some(lang => lang.toLowerCase().includes(searchTerm)) ||
          // Search in education qualifications
          psych.eduQualifications?.some(edu => 
            edu.institution.toLowerCase().includes(searchTerm) ||
            edu.degree?.toLowerCase().includes(searchTerm) ||
            edu.field?.toLowerCase().includes(searchTerm) ||
            edu.title?.toLowerCase().includes(searchTerm)
          ) ||
          // Search in experiences
          psych.experiences?.some(exp => 
            exp.title.toLowerCase().includes(searchTerm) ||
            exp.description.toLowerCase().includes(searchTerm)
          )
        );
      }

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
        eduQualifications: psych.eduQualifications?.map(edu => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          startDate: edu.startDate,
          endDate: edu.endDate,
          grade: edu.grade,
          document: edu.document,
          title: edu.title,
          year: edu.year,
          status: edu.status,
          proof: edu.proof,
          approvedAt: edu.approvedAt,
          createdAt: edu.createdAt,
          updatedAt: edu.updatedAt
        })) || [],
        experiences: psych.experiences?.map(exp => ({
          id: exp.id,
          userId: exp.userId,
          position: exp.position,
          company: exp.company,
          title: exp.title,
          description: exp.description,
          startDate: exp.startDate,
          endDate: exp.endDate,
          status: exp.status,
          proof: exp.proof,
          document: exp.document,
          approvedAt: exp.approvedAt,
          approvedBy: exp.approvedBy,
          createdAt: exp.createdAt,
          updatedAt: exp.updatedAt
        })) || [],
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

  async getPsychiatristById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const psychiatrist = await Psychiatrist.findPsychiatristByIdForAdmin(parseInt(id));

      if (!psychiatrist) {
        return res.status(404).json({ message: 'Psychiatrist not found' });
      }

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
        eduQualifications: psychiatrist.eduQualifications?.map(edu => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          startDate: edu.startDate,
          endDate: edu.endDate,
          grade: edu.grade,
          document: edu.document,
          title: edu.title,
          year: edu.year,
          status: edu.status,
          proof: edu.proof,
          approvedAt: edu.approvedAt,
          createdAt: edu.createdAt,
          updatedAt: edu.updatedAt
        })) || [],
        experiences: psychiatrist.experiences?.map(exp => ({
          id: exp.id,
          userId: exp.userId,
          position: exp.position,
          company: exp.company,
          title: exp.title,
          description: exp.description,
          startDate: exp.startDate,
          endDate: exp.endDate,
          status: exp.status,
          proof: exp.proof,
          document: exp.document,
          approvedAt: exp.approvedAt,
          approvedBy: exp.approvedBy,
          createdAt: exp.createdAt,
          updatedAt: exp.updatedAt
        })) || [],
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

      if (status === 'rejected' && !rejectionReason) {
        return res
          .status(400)
          .json({ message: 'Rejection reason is required when status is rejected' });
      }

      const updatedPsychiatrist = await Psychiatrist.updatePsychiatristStatus(
        parseInt(id),
        status,
        rejectionReason
      );

      if (!updatedPsychiatrist) {
        return res.status(404).json({ message: 'Psychiatrist not found' });
      }

      const response = {
        ...updatedPsychiatrist.get({ plain: true }),
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
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