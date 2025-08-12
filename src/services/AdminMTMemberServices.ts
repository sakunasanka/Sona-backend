import MtMember from '../models/MTMember';
import User from '../models/User';
import { Op } from 'sequelize';
import nodemailer from 'nodemailer';

interface MTMemberData {
  userId: number;
  position: string;
  phone?: string;
  location?: string;
  joinDate: string;
  department: string;
  experience?: string;
  skills?: string[];
  bio?: string;
  education?: string[];
  certifications?: string[];
  previousRoles?: Array<{
    company: string;
    position: string;
    duration: string;
  }>;
  achievements?: string[];
  salary?: string;
  //reportingTo?: string;
}

// interface RejectionData {
//   memberId: string;
//   reason: string;
// }

interface SearchFilterOptions {
  searchTerm?: string;
  department?: string;
  sortBy?: 'name' | 'position' | 'department' | 'joinDate';
  sortOrder?: 'asc' | 'desc';
}

class AdminMTMemberServices{
  // Create a new team member
  async createMember(memberData: MTMemberData) {
    try {
      const member = await MtMember.create({
        ...memberData,
        skills: memberData.skills || [],
        education: memberData.education || [],
        certifications: memberData.certifications || [],
        previousRoles: memberData.previousRoles || [],
        achievements: memberData.achievements || [],
      });
      return member;
    } catch (error) {
      throw new Error(`Error creating team member: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get all team members with optional filtering and sorting
  async getAllMembers(options: SearchFilterOptions = {}) {
    const {
      searchTerm = '',
      department = 'all',
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    const where: any = {};
    const userWhere: any = {};
    
    if (searchTerm) {
      userWhere[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },
      ];
      
      where[Op.or] = [
        { position: { [Op.iLike]: `%${searchTerm}%` } },
        { department: { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    if (department && department !== 'all') {
      where.department = department;
    }

    const order: any = [];
    if (sortBy === 'joinDate') {
      order.push(['joinDate', sortOrder]);
    } else if (sortBy === 'name') {
      order.push([{ model: User, as: 'user' }, 'name', sortOrder]);
    } else {
      order.push([sortBy, sortOrder]);
    }

    return await MtMember.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        where: userWhere,
        attributes: ['id', 'name', 'email', 'avatar'],
      }],
      order,
    });
  }

  // Get a single member by ID
  async getMemberById(id: string) {
    return await MtMember.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar'],
      }]
    });
  }

  // // Update a team member
  // async updateMember(id: string, updateData: Partial<MTMemberData>) {
  //   const member = await MtMember.findByPk(id);
  //   if (!member) {
  //     throw new Error('Team member not found');
  //   }

  //   return await member.update(updateData);
  // }

//   // Reject a team member
//   async rejectMember({ memberId, reason }: RejectionData) {
//     const member = await MtMember.findByPk(memberId, {
//       include: [{
//         model: User,
//         as: 'user',
//         attributes: ['email', 'name'],
//       }]
//     });
    
//     if (!member || !member.user) {
//       throw new Error('Team member not found');
//     }

//     // Send rejection email (simplified example)
//     const emailSent = await this.sendRejectionEmail(
//       member.user.email, 
//       member.user.name, 
//       member.position, 
//       reason
//     );

//     return await member.update({
//       status: 'rejected',
//       rejectionReason: reason,
//       rejectionEmailSent: emailSent,
//     });
//   }

//   // Delete a team member
//   async deleteMember(id: string) {
//     const member = await MtMember.findByPk(id);
//     if (!member) {
//       throw new Error('Team member not found');
//     }

//     await member.destroy();
//     return { message: 'Team member deleted successfully' };
//   }

//   // Get unique departments
//   async getDepartments() {
//     const members = await MtMember.findAll({
//       attributes: ['department'],
//       group: ['department'],
//     });
    
//     return members.map(m => m.department);
//   }

//   // Helper method to send rejection email
//   private async sendRejectionEmail(email: string, name: string, position: string, reason: string) {
//     try {
//       // In a real app, configure nodemailer with your SMTP settings
//       const transporter = nodemailer.createTransport({
//         // Your email configuration here
//         service: 'gmail',
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       const mailOptions = {
//         from: process.env.EMAIL_FROM,
//         to: email,
//         subject: 'Management Team Application Update',
//         text: `Dear ${name},\n\nThank you for your interest in joining our management team as ${position}.\n\nAfter careful consideration, we have decided not to move forward with your application at this time.\n\nReason for rejection:\n${reason}\n\nWe appreciate the time and effort you put into your application. We encourage you to apply for future opportunities that match your qualifications.\n\nBest regards,\nHR Management Team`,
//       };

//       await transporter.sendMail(mailOptions);
//       return true;
//     } catch (error) {
//       console.error('Failed to send rejection email:', error);
//       return false;
//     }
//   }
 }

export default new AdminMTMemberServices();