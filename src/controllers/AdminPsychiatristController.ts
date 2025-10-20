import { Request, Response } from 'express';
import Psychiatrist from '../models/Psychiatrist';
import { validationResult } from 'express-validator';
import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';
import { NotificationHelper } from '../utils/NotificationHelper';

class AdminPsychiatristController {
 
  // Get all psychiatrists
  async getAllPsychiatrists(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      
      // Define interface for psychiatrist data
      interface PsychiatristData {
        id: number;
        firebaseId: string;
        name: string;
        email: string;
        avatar?: string;
        role: string;
        createdAt: string;
        updatedAt: string;
        title: string;
        specialities: string[];
        address: string;
        contact_no: string;
        license_no: string;
        idCard: string;
        isVolunteer?: boolean;
        isAvailable?: boolean;
        description?: string;
        rating?: number;
        sessionFee?: number;
        status: string;
        coverImage?: string;
        instagram?: string;
        linkedin?: string;
        x?: string;
        website?: string;
        languages?: string[];
        rejectionReason?: string;
        rejectedBy?: number;
        rejectedByName?: string;
        rejectedByRole?: string;
      }

      // Use raw SQL to get psychiatrists with rejection info
      let psychiatrists = await sequelize.query<PsychiatristData>(`
        SELECT 
          u.id, 
          u."firebaseId", 
          u.name, 
          u.email, 
          u.avatar, 
          u.role, 
          u."createdAt", 
          u."updatedAt",
          p.title, 
          p.specialities, 
          p.address, 
          p.contact_no, 
          p."licenseNo" as license_no, 
          p."idCard",
          p."isVolunteer", 
          p."isAvailable", 
          p.description, 
          p.rating, 
          p."sessionFee",
          p.status,
          p."coverImage", 
          p.instagram, 
          p.linkedin, 
          p.x, 
          p.website,
          p.languages,
          rr.reason as "rejectionReason",
          rr."rejectedBy",
          admin_user.name as "rejectedByName",
          admin_user.role as "rejectedByRole"
        FROM users u
        JOIN psychiatrists p ON u.id = p."userId"
        LEFT JOIN rejection_reasons rr ON u.id = rr."userId"
        LEFT JOIN users admin_user ON rr."rejectedBy" = admin_user.id
        WHERE u."role" = 'Psychiatrist'
        ORDER BY u."name" ASC
      `, {
        type: QueryTypes.SELECT
      });

      // Apply filters if provided
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
          psych.description?.toLowerCase().includes(searchTerm)
        );
      }

      // Now fetch education qualifications and experiences for each psychiatrist
      const psychiatristsWithDetails = await Promise.all(
        psychiatrists.map(async (psych) => {
          // Fetch education qualifications
          const eduQualifications = await sequelize.query(`
            SELECT 
              id,
              "userId",
              institution,
              degree,
              field,
              "startDate",
              "endDate",
              grade,
              document,
              title,
              year,
              status,
              proof,
              "approvedAt",
              "createdAt",
              "updatedAt"
            FROM edu_qualifications 
            WHERE "userId" = :userId
            ORDER BY "createdAt" DESC
          `, {
            replacements: { userId: psych.id },
            type: QueryTypes.SELECT
          });

          // Fetch experiences
          const experiences = await sequelize.query(`
            SELECT 
              id,
              "userId",
              position,
              company,
              title,
              description,
              "startDate",
              "endDate",
              status,
              proof,
              document,
              "approvedAt",
              "createdAt",
              "updatedAt"
            FROM experiences 
            WHERE "userId" = :userId
            ORDER BY "createdAt" DESC
          `, {
            replacements: { userId: psych.id },
            type: QueryTypes.SELECT
          });

          return {
            ...psych,
            eduQualifications: eduQualifications || [],
            experiences: experiences || []
          };
        })
      );

      res.status(200).json(psychiatristsWithDetails);
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
      
      // Use raw SQL queries to get psychiatrist data with all details
      const psychiatristResult = await sequelize.query(`
        SELECT 
          u.id, 
          u."firebaseId", 
          u.name, 
          u.email, 
          u.avatar, 
          u.role, 
          u."createdAt", 
          u."updatedAt",
          p.title, 
          p.specialities, 
          p.address, 
          p.contact_no, 
          p."licenseNo" as license_no, 
          p."idCard",
          p."isVolunteer", 
          p."isAvailable", 
          p.description, 
          p.rating, 
          p."sessionFee",
          p.status,
          p."coverImage", 
          p.instagram, 
          p.linkedin, 
          p.x, 
          p.website,
          p.languages,
          rr.reason as "rejectionReason",
          rr."rejectedBy",
          admin_user.name as "rejectedByName",
          admin_user.role as "rejectedByRole"
        FROM users u
        JOIN psychiatrists p ON u.id = p."userId"
        LEFT JOIN rejection_reasons rr ON u.id = rr."userId"
        LEFT JOIN users admin_user ON rr."rejectedBy" = admin_user.id
        WHERE u.id = :id AND u."role" = 'Psychiatrist'
      `, {
        replacements: { id: parseInt(id) },
        type: QueryTypes.SELECT
      });

      if (psychiatristResult.length === 0) {
        return res.status(404).json({ message: 'Psychiatrist not found' });
      }

      const psychiatrist = psychiatristResult[0] as any;

      // Fetch education qualifications
      const eduQualifications = await sequelize.query(`
        SELECT 
          id,
          "userId",
          institution,
          degree,
          field,
          "startDate",
          "endDate",
          grade,
          document,
          title,
          year,
          status,
          proof,
          "approvedAt",
          "createdAt",
          "updatedAt"
        FROM edu_qualifications 
        WHERE "userId" = :userId
        ORDER BY "createdAt" DESC
      `, {
        replacements: { userId: parseInt(id) },
        type: QueryTypes.SELECT
      });

      // Fetch experiences
      const experiences = await sequelize.query(`
        SELECT 
          id,
          "userId",
          position,
          company,
          title,
          description,
          "startDate",
          "endDate",
          status,
          proof,
          document,
          "approvedAt",
          "createdAt",
          "updatedAt"
        FROM experiences 
        WHERE "userId" = :userId
        ORDER BY "createdAt" DESC
      `, {
        replacements: { userId: parseInt(id) },
        type: QueryTypes.SELECT
      });

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
        eduQualifications: eduQualifications || [],
        experiences: experiences || [],
        createdAt: psychiatrist.createdAt,
        updatedAt: psychiatrist.updatedAt,
        // Include rejection information
        rejectionReason: psychiatrist.rejectionReason,
        rejectedBy: psychiatrist.rejectedBy,
        rejectedByName: psychiatrist.rejectedByName,
        rejectedByRole: psychiatrist.rejectedByRole
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

      const { id } = req.params; // psychiatrist's userId (PK)
      const { status, rejectionReason } = req.body;

      // Validate rejection reason for rejected status
      if (status === 'rejected' && !rejectionReason) {
        return res
          .status(400)
          .json({ message: 'Rejection reason is required when status is rejected' });
      }

      // Get the current admin user ID from the authenticated request
      const rejectedById = req.user?.dbUser.id;

      if (status === 'rejected' && !rejectedById) {
        return res.status(401).json({
          message: 'Authentication required for rejection',
        });
      }

      // Update psychiatrist status using the model
      const updatedPsychiatrist = await Psychiatrist.updatePsychiatristStatus(
        parseInt(id),
        status,
        rejectionReason,
        rejectedById // Pass the rejectedById
      );

      if (!updatedPsychiatrist) {
        return res.status(404).json({ message: 'Psychiatrist not found' });
      }

      // Send notification to psychiatrist
      try {
        if (status === 'approved') {
          await NotificationHelper.profileApproved(parseInt(id), 'Psychiatrist');
        } else if (status === 'rejected') {
          await NotificationHelper.profileRejected(parseInt(id), 'Psychiatrist', rejectionReason);
        }
      } catch (notificationError) {
        console.error('Failed to send psychiatrist status notification:', notificationError);
        // Don't fail the status update if notification fails
      }

      // Define interface for rejection info
      interface RejectionInfo {
        rejectionReason: string;
        rejectedBy: number;
        rejectedByName: string;
        rejectedByRole: string;
      }

      // Get rejection information separately
      const rejectionInfo = await sequelize.query<RejectionInfo>(`
        SELECT 
          rr.reason as "rejectionReason",
          rr."rejectedBy",
          admin_user.name as "rejectedByName",
          admin_user.role as "rejectedByRole"
        FROM rejection_reasons rr
        LEFT JOIN users admin_user ON rr."rejectedBy" = admin_user.id
        WHERE rr."userId" = :userId
      `, {
        replacements: { userId: parseInt(id) },
        type: QueryTypes.SELECT
      });

      const response = {
        ...updatedPsychiatrist.get({ plain: true }),
        rejectionReason: rejectionInfo[0]?.rejectionReason || null,
        rejectedBy: rejectionInfo[0]?.rejectedBy || null,
        rejectedByName: rejectionInfo[0]?.rejectedByName || null,
        rejectedByRole: rejectionInfo[0]?.rejectedByRole || null,
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
  
  // New method to revoke psychiatrist status
  async revokePsychiatristStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get the current admin user ID from the authenticated request
      const revokedById = req.user?.dbUser.id;

      if (!revokedById) {
        return res.status(401).json({ 
          message: 'Authentication required for revocation' 
        });
      }

      const updatedPsychiatrist = await Psychiatrist.updatePsychiatristStatus(
        parseInt(id),
        'pending', // Reset status to pending
        undefined, // No rejection reason for revocation
        revokedById // Pass the admin user ID
      );

      if (!updatedPsychiatrist) {
        return res.status(404).json({ message: 'Psychiatrist not found' });
      }

      // Define interface for rejection info
      interface RejectionInfo {
        rejectionReason: string;
        rejectedBy: number;
        rejectedByName: string;
        rejectedByRole: string;
      }

      // Get rejection information separately
      const rejectionInfo = await sequelize.query<RejectionInfo>(`
        SELECT 
          rr.reason as "rejectionReason",
          rr."rejectedBy",
          admin_user.name as "rejectedByName",
          admin_user.role as "rejectedByRole"
        FROM rejection_reasons rr
        LEFT JOIN users admin_user ON rr."rejectedBy" = admin_user.id
        WHERE rr."userId" = :userId
      `, {
        replacements: { userId: parseInt(id) },
        type: QueryTypes.SELECT
      });

      const response = {
        ...updatedPsychiatrist.get({ plain: true }),
        rejectionReason: rejectionInfo[0]?.rejectionReason || null,
        rejectedBy: rejectionInfo[0]?.rejectedBy || null,
        rejectedByName: rejectionInfo[0]?.rejectedByName || null,
        rejectedByRole: rejectionInfo[0]?.rejectedByRole || null,
        message: 'Psychiatrist status revoked successfully. Status reset to pending.'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error revoking psychiatrist status:', error);
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