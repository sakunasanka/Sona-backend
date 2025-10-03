import { Request, Response, NextFunction } from "express";
import { ApiResponseUtil } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { CounselorService } from "../services/CounselorServices";
import { ValidationError } from "../utils/errors";
import Counselor from "../models/Counselor";
import { validateData, updateCounselorProfileSchema } from "../schema/ValidationSchema";

export const getAllAvailableCounselors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counselors = await CounselorService.getAllAvailableCounselors();
    
    ApiResponseUtil.success(res, {
      counselors,
      count: counselors.length
    }, "Available counselors retrieved successfully");
    
  } catch (error) {
    next(error);
  }
};

export const getCounselorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      throw new ValidationError('Valid counselor ID is required');
    }
    
    const counselor = await CounselorService.getCounselorById(Number(id));
    
    ApiResponseUtil.success(res, { counselor }, "Counselor retrieved successfully");
    
  } catch (error) {
    next(error);
  }
};

export const updateCounselorAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    
    if (!id || isNaN(Number(id))) {
      throw new ValidationError('Valid counselor ID is required');
    }
    
    if (typeof isAvailable !== 'boolean') {
      throw new ValidationError('isAvailable must be a boolean value');
    }
    
    const counselor = await CounselorService.updateCounselorAvailability(Number(id), isAvailable);
    
    ApiResponseUtil.success(res, { counselor }, "Counselor availability updated successfully");
    
  } catch (error) {
    next(error);
  }
};

// For admin use - get all counselors regardless of status
export const getAllCounselors = asyncHandler(async (req: Request, res: Response) => {
  const counselors = await Counselor.findAllCounselors();
  
  ApiResponseUtil.success(res, {
    counselors,
    count: counselors.length
  }, "All counselors retrieved successfully");
});

// For admin use - update counselor status (approve/reject)
export const updateCounselorStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!id || isNaN(Number(id))) {
    throw new ValidationError('Valid counselor ID is required');
  }
  
  if (!status || typeof status !== 'string' || !['pending', 'approved', 'rejected'].includes(status)) {
    throw new ValidationError('Valid status is required (pending, approved, or rejected)');
  }
  
  const counselor = await Counselor.updateCounselorStatus(Number(id), status);
  
  if (!counselor) {
    return ApiResponseUtil.notFound(res, "Counselor not found");
  }
  
  ApiResponseUtil.success(res, { counselor }, "Counselor status updated successfully");
});

/**
 * @desc    Get counselor dashboard statistics
 * @route   GET /api/counselors/dashboard/stats
 * @access  Private (counselor only)
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  const stats = await CounselorService.getDashboardStatistics(counselorId);

  ApiResponseUtil.success(res, stats, "Dashboard statistics retrieved successfully");
});

/**
 * @desc    Get recent sessions for counselor
 * @route   GET /api/counselors/sessions/recent
 * @access  Private (counselor only)
 */
export const getRecentSessions = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const limit = parseInt(req.query.limit as string) || 5;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  const sessions = await CounselorService.getRecentSessions(counselorId, limit);

  ApiResponseUtil.success(res, sessions, "Recent sessions retrieved successfully");
});

/**
 * @desc    Get recent activity for counselor
 * @route   GET /api/counselors/activity/recent
 * @access  Private (counselor only)
 */
export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const limit = parseInt(req.query.limit as string) || 5;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  const activities = await CounselorService.getRecentActivity(counselorId, limit);

  ApiResponseUtil.success(res, activities, "Recent activity retrieved successfully");
});

/**
 * @desc    Get counselor profile info
 * @route   GET /api/counselors/profile
 * @access  Private (counselor only)
 */
export const getCounselorProfile = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  const profile = await CounselorService.getCounselorProfile(counselorId);

  ApiResponseUtil.success(res, profile, "Counselor profile retrieved successfully");
});

/**
 * @desc    Update counselor profile
 * @route   PUT /api/counselors/profile
 * @access  Private (counselor only)
 */
export const updateCounselorProfile = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  // Validate the request body
  const validatedData = await validateData(updateCounselorProfileSchema, req.body);

  const updatedProfile = await CounselorService.updateCounselorProfile(counselorId, validatedData);

  ApiResponseUtil.success(res, updatedProfile, "Counselor profile updated successfully");
});

/**
 * @desc    Get counselor detailed profile for profile page
 * @route   GET /api/counselors/profile/detailed
 * @access  Private (counselor only)
 */
export const getCounselorDetailedProfile = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  const detailedProfile = await CounselorService.getCounselorDetailedProfile(counselorId);

  ApiResponseUtil.success(res, detailedProfile, "Detailed counselor profile retrieved successfully");
});