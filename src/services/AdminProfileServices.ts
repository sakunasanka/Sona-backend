import User from '../models/User';
import mt_members from '../models/MTMember';
import { ValidationError } from '../utils/errors';

interface AdminProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  joinDate?: string;
  role: string;
  profilePicture?: string;
  lastLogin?: string;
}

class AdminProfileServices {
  // Get admin profile data
  public async getAdminProfile(userId: number): Promise<AdminProfileData> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Check if user is admin
    if (user.role !== 'Admin' && user.role !== 'MT-member') {
      throw new ValidationError('Access denied. Admin or MT-Team role required.');
    }

    // For MT-Team members, get additional data from mt_members table
    let mtMemberData = null;
    if (user.role === 'MT-member') {
      mtMemberData = await mt_members.findOne({
        where: { userId }
      });
    }

    return {
      id: `ADM${user.id.toString().padStart(3, '0')}`,
      name: user.name,
      email: user.email,
      phone: mtMemberData?.phone || '',
      location: mtMemberData?.location || '',
      joinDate: mtMemberData?.joinDate || user.createdAt.toISOString().split('T')[0],
      role: user.role === 'MT-member' ? (mtMemberData?.position || 'MT Team Member') : 'Administrator',
      profilePicture: user.avatar || '/assets/images/profiles/default.jpg',
      lastLogin: new Date().toISOString() // You might want to store this separately
    };
  }

  // Update admin profile
  public async updateAdminProfile(userId: number, updateData: any): Promise<AdminProfileData> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Check if user is admin
    if (user.role !== 'Admin' && user.role !== 'MT-member') {
      throw new ValidationError('Access denied. Admin or MT-Team role required.');
    }

    // Update user basic info
    const userUpdateData: any = {};
    if (updateData.name) userUpdateData.name = updateData.name;
    if (updateData.email) userUpdateData.email = updateData.email;

    if (Object.keys(userUpdateData).length > 0) {
      await user.update(userUpdateData);
    }

    // For MT-Team members, update additional data in mt_members table
    if (user.role === 'MT-member') {
      const mtMemberData = await mt_members.findOne({ where: { userId } });
      const mtUpdateData: any = {};
      
      if (updateData.phone) mtUpdateData.phone = updateData.phone;
      if (updateData.location) mtUpdateData.location = updateData.location;

      if (Object.keys(mtUpdateData).length > 0) {
        if (mtMemberData) {
          await mtMemberData.update(mtUpdateData);
        } else {
          // Create mt_members record if it doesn't exist
          await mt_members.create({
            userId,
            ...mtUpdateData
          });
        }
      }
    }

    // Return updated profile
    return this.getAdminProfile(userId);
  }

  // Update profile picture
  public async updateProfilePicture(userId: number, profilePicture: string): Promise<AdminProfileData> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Check if user is admin
    if (user.role !== 'Admin' && user.role !== 'MT-member') {
      throw new ValidationError('Access denied. Admin or MT-Team role required.');
    }

    await user.update({ avatar: profilePicture });

    return this.getAdminProfile(userId);
  }
}

export default new AdminProfileServices();