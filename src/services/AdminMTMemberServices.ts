import { adminAuth } from '../config/firebase';
import User from '../models/User';
import MTMember from '../models/MTMember';
import { CreateMTMemberData, UpdateMTMemberData } from '../types/UserTypes';
import { Op } from 'sequelize'; 

class AdminMTMemberServices {
  static async createMTMember(mtMemberData: CreateMTMemberData) {
    try {
      // 1. Create Firebase user
      const firebaseUser = await adminAuth.createUser({
        email: mtMemberData.email,
        password: mtMemberData.password,
        displayName: mtMemberData.name,
        //emailVerified: false,
        //disabled: false,
      });

      // 2. Create base User record in PostgreSQL
      const dbUser = await User.create({
        firebaseId: firebaseUser.uid,
        email: mtMemberData.email,
        name: mtMemberData.name,
        role: 'MT-member',
        avatar: mtMemberData.avatar
      });

      // 3. Create the extended mt_members record
      const mtMember = await MTMember.create({
        userId: dbUser.id,
        position: mtMemberData.position,
        phone: mtMemberData.phone,
        location: mtMemberData.location,
        joinDate: mtMemberData.joinDate,
        department: mtMemberData.department,
        experience: mtMemberData.experience,
        skills: mtMemberData.skills,
        bio: mtMemberData.bio,
        education: mtMemberData.education,
        certifications: mtMemberData.certifications,
        previousRoles: mtMemberData.previousRoles,
        achievements: mtMemberData.achievements,
        salary: mtMemberData.salary,
        // reportingTo: mtMemberData.reportingTo
      });

      // Include user data in the response
      const mtMemberWithUser = await MTMember.findByPk(mtMember.userId, {
        include: [{ model: User, as: 'user' }]
      });

      return {
        firebaseUser,
        dbUser,
        mtMember: mtMemberWithUser
      };
    } catch (error) {
      console.error("Error creating MT Member:", error);
      throw error;
    }
  }

  static async getMTMembers(filters: { department?: string; search?: string } = {}) {
    try {
      const whereClause: any = {};
      const userWhereClause: any = {};
      
      if (filters.department && filters.department !== 'all') {
        whereClause.department = filters.department;
      }
      
      if (filters.search) {
        userWhereClause.name = { [Op.iLike]: `%${filters.search}%` };
        whereClause[Op.or] = [
          { position: { [Op.iLike]: `%${filters.search}%` } },
          { department: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }
      
      const members = await MTMember.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id', 'name', 'email', 'avatar', 'firebaseId']
        }]
      });
      
      return members;
    } catch (error) {
      console.error("Error fetching MT Members:", error);
      throw error;
    }
  }

  static async getMTMemberById(userId: number) {
    try {
      const member = await MTMember.findByPk(userId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar', 'firebaseId']
        }]
      });
      
      return member;
    } catch (error) {
      console.error("Error fetching MT Member:", error);
      throw error;
    }
  }

  static async updateMTMember(userId: number, updateData: UpdateMTMemberData) {
    try {
      const member = await MTMember.findByPk(userId);
      
      if (!member) {
        return null;
      }
      
      // Update the mt_members record
      await member.update(updateData);
      
      // If there are user updates (like name or avatar), update the User record too
      if (updateData.name || updateData.avatar) {
        const user = await User.findByPk(userId);
        if (user) {
          await user.update({
            name: updateData.name || user.name,
            avatar: updateData.avatar || user.avatar
          });
        }
      }
      
      // Return the updated member with user data
      const updatedMember = await MTMember.findByPk(userId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar', 'firebaseId']
        }]
      });
      
      return updatedMember;
    } catch (error) {
      console.error("Error updating MT Member:", error);
      throw error;
    }
  }

  static async deleteMTMember(userId: number) {
    try {
      const member = await MTMember.findByPk(userId);
      
      if (!member) {
        return null;
      }
      
      // Get the user record to get the Firebase UID
      const user = await User.findByPk(userId);
      
      // Delete the mt_members record
      await member.destroy();
      
      // Delete the base user record
      if (user) {
        await user.destroy();
        
        // Delete the Firebase user
        try {
          await adminAuth.deleteUser(user.firebaseId);
        } catch (firebaseError) {
          console.error("Error deleting Firebase user:", firebaseError);
          // We'll continue even if Firebase deletion fails
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting MT Member:", error);
      throw error;
    }
  }
}

export default AdminMTMemberServices;