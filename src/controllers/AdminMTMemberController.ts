import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { ValidationError } from '../utils/errors';
import MTMemberService from '../services/AdminMTMemberServices';
import { CreateMTMemberData } from '../types/UserTypes';

export const createMTMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Create MT Member request received:", req.body);
    const { email, password, displayName, additionalData } = req.body;

    if (!email || !password || !displayName) {
      throw new ValidationError("Email, password, and displayName are required");
    }

    const mtMemberData: CreateMTMemberData = {
      email: email,
      password: password,
      name: displayName,
      role: 'MT-member' as const,
      // MT Member specific data
      position: additionalData.position,
      phone: additionalData.phone,
      location: additionalData.location,
      joinDate: additionalData.joinDate,
      department: additionalData.department,
      experience: additionalData.experience,
      skills: additionalData.skills || [],
      bio: additionalData.bio,
      education: additionalData.education || [],
      certifications: additionalData.certifications || [],
      previousRoles: additionalData.previousRoles || [],
      achievements: additionalData.achievements || [],
      salary: additionalData.salary,
      // reportingTo: additionalData.reportingTo,
      avatar: additionalData.avatar || ""
    };

    console.log("About to call MTMemberService.createMTMember with:", mtMemberData);
    const result = await MTMemberService.createMTMember(mtMemberData);

    if (result) {
      ApiResponseUtil.created(res, {
        user: result.dbUser,
        mtMember: result.mtMember,
        firebaseUser: {
          uid: result.firebaseUser.uid,
          email: result.firebaseUser.email,
          displayName: result.firebaseUser.displayName,
        }
      }, "Management Team Member created successfully");
    }
  } catch (error) {
    next(error);
  }
};

export const getMTMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department, search } = req.query;
    const filters = {
      department: department as string,
      search: search as string
    };
    
    const members = await MTMemberService.getMTMembers(filters);
    ApiResponseUtil.success(res, members, "Management Team Members retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const getMTMemberById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const member = await MTMemberService.getMTMemberById(parseInt(id));
    
    if (!member) {
      return ApiResponseUtil.notFound(res, "Management Team Member not found");
    }
    
    ApiResponseUtil.success(res, member, "Management Team Member retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const updateMTMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedMember = await MTMemberService.updateMTMember(parseInt(id), updateData);
    
    if (!updatedMember) {
      return ApiResponseUtil.notFound(res, "Management Team Member not found");
    }
    
    ApiResponseUtil.success(res, updatedMember, "Management Team Member updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteMTMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await MTMemberService.deleteMTMember(parseInt(id));
    
    if (!result) {
      return ApiResponseUtil.notFound(res, "Management Team Member not found");
    }
    
    ApiResponseUtil.success(res, null, "Management Team Member deleted successfully");
  } catch (error) {
    next(error);
  }
};