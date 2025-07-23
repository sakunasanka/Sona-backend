import { Request, Response, NextFunction } from "express";
import { ApiResponseUtil } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { CounselorService } from "../services/CounselorServices";
import { ValidationError } from "../utils/errors";
import Counselor from "../models/Counselor";

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