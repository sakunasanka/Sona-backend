import { Request, Response, NextFunction } from "express";
import { ApiResponseUtil } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { CounselorService } from "../services/CounselorServices";
import { ValidationError } from "../utils/errors";
import Counselor from "../models/Counselor";
import { validateData, updateCounselorProfileSchema, updateCounselorVolunteerSchema } from "../schema/ValidationSchema";
import CounselorClientService from "../services/CounselorClientService";
import { isArray } from "util";

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

/**
 * @desc    Get all clients for a counselor
 * @route   GET /api/counselors/clients
 * @access  Private (counselor only)
 */
export const getCounselorClients = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  // Extract query parameters
  const {
    page,
    limit,
    search,
    filter,
    sort
  } = req.query;

  // Validate filter parameter
  const validFilters = ['all', 'active', 'inactive', 'new'];
  if (filter && !validFilters.includes(filter as string)) {
    throw new ValidationError('Invalid filter. Must be one of: all, active, inactive, new');
  }

  // Validate sort parameter
  const validSorts = ['name', 'last_session', 'join_date'];
  if (sort && !validSorts.includes(sort as string)) {
    throw new ValidationError('Invalid sort. Must be one of: name, last_session, join_date');
  }

  const filters = {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    search: search as string,
    filter: (filter as 'all' | 'active' | 'inactive' | 'new') || 'all',
    sort: (sort as 'name' | 'last_session' | 'join_date') || 'name'
  };

  const clientsData = await CounselorClientService.getCounselorClients(counselorId, filters);

  ApiResponseUtil.success(res, clientsData, "Counselor clients retrieved successfully");
});

/**
 * @desc    Get detailed information about a specific client
 * @route   GET /api/counsellor/clients/:clientId
 * @access  Private (counselor only)
 */
export const getClientDetails = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const { clientId } = req.params;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  if (!clientId || isNaN(Number(clientId))) {
    throw new ValidationError('Valid client ID is required');
  }

  const clientDetails = await CounselorClientService.getClientDetails(counselorId, Number(clientId));

  ApiResponseUtil.success(res, clientDetails, "Client details retrieved successfully");
});

/**
 * @desc    Create a new note for a specific client
 * @route   POST /api/counsellor/clients/:clientId/notes
 * @access  Private (counselor only)
 */
export const createClientNote = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const { clientId } = req.params;
  const { content, isPrivate } = req.body;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  if (!clientId || isNaN(Number(clientId))) {
    throw new ValidationError('Valid client ID is required');
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new ValidationError('Note content is required and cannot be empty');
  }

  const noteData = {
    content: content.trim(),
    isPrivate: Boolean(isPrivate)
  };

  const newNote = await CounselorClientService.createClientNote(counselorId, Number(clientId), noteData);

  ApiResponseUtil.success(res, newNote, "Client note created successfully");
});

/**
 * @desc    Soft delete a client note (only if created by the current counselor)
 * @route   DELETE /api/counsellor/clients/:clientId/notes/:noteId
 * @access  Private (counselor only - can only delete own notes)
 */
export const deleteClientNote = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const { noteId } = req.params;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  if (!noteId || isNaN(Number(noteId))) {
    throw new ValidationError('Valid note ID is required');
  }

  const deletedNote = await CounselorClientService.deleteClientNote(counselorId, Number(noteId));

  ApiResponseUtil.success(res, deletedNote, "Client note deleted successfully");
});

/**
 * @desc    Update a client note (only if created by the current counselor)
 * @route   PUT /api/counsellor/clients/:clientId/notes/:noteId
 * @access  Private (counselor only - can only edit own notes)
 */
export const updateClientNote = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const { noteId } = req.params;
  const { content, isPrivate } = req.body;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  if (!noteId || isNaN(Number(noteId))) {
    throw new ValidationError('Valid note ID is required');
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new ValidationError('Note content is required and cannot be empty');
  }

  const noteData = {
    content: content.trim(),
    isPrivate: Boolean(isPrivate)
  };

  const updatedNote = await CounselorClientService.updateClientNote(counselorId, Number(noteId), noteData);

  ApiResponseUtil.success(res, updatedNote, "Client note updated successfully");
});

/**
 * @desc    Add a concern to a client's concerns list
 * @route   POST /api/counsellor/clients/:clientId/concerns
 * @access  Private (counselor only)
 */
export const addClientConcern = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const { clientId } = req.params;
  const { concern } = req.body;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  if (!clientId || isNaN(Number(clientId))) {
    throw new ValidationError('Valid client ID is required');
  }

  if (!concern || typeof concern !== 'string' || concern.trim().length === 0) {
    throw new ValidationError('Concern is required and must be a non-empty string');
  }

  const result = await CounselorClientService.addConcernToClient(counselorId, Number(clientId), concern.trim());

  ApiResponseUtil.success(res, result, 'Concern added successfully');
});

/**
 * @desc    Remove a concern from a client's concerns list
 * @route   DELETE /api/counsellor/clients/:clientId/concerns
 * @access  Private (counselor only)
 */
export const removeClientConcern = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const { clientId } = req.params;
  const { concern } = req.body;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  if (!clientId || isNaN(Number(clientId))) {
    throw new ValidationError('Valid client ID is required');
  }

  if (!concern || typeof concern !== 'string' || concern.trim().length === 0) {
    throw new ValidationError('Concern is required and must be a non-empty string');
  }

  const result = await CounselorClientService.removeConcernFromClient(counselorId, Number(clientId), concern.trim());

  ApiResponseUtil.success(res, result, 'Concern removed successfully');
});

/**
 * @desc    Update counselor volunteer status and session fee
 * @route   PUT /api/counselors/volunteer-status
 * @access  Private (counselor only)
 */
export const updateCounselorVolunteerStatus = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  // Validate the request body
  const validatedData = await validateData(updateCounselorVolunteerSchema, req.body) as { isVolunteer: boolean; sessionFee: number };

  const updatedCounselor = await CounselorService.updateCounselorVolunteerStatus(
    counselorId, 
    validatedData.isVolunteer, 
    validatedData.sessionFee
  );

  ApiResponseUtil.success(res, updatedCounselor, "Counselor volunteer status and session fee updated successfully");
});

/**
 * @desc    Get counselor volunteer status and session fee
 * @route   GET /api/counselors/volunteer-status
 * @access  Private (counselor only)
 */
export const getCounselorVolunteerStatus = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  const counselor = await CounselorService.getCounselorById(counselorId);

  ApiResponseUtil.success(res, {
    isVolunteer: counselor.isVolunteer,
    sessionFee: counselor.sessionFee
  }, "Counselor volunteer status retrieved successfully");
});

/**
 * @desc    Get counselor earnings summary
 * @route   GET /api/counselors/earnings/summary
 * @access  Private (counselor only)
 */
export const getCounselorEarningsSummary = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  const summary = await CounselorService.getCounselorEarningsSummary(counselorId);

  ApiResponseUtil.success(res, summary, "Counselor earnings summary retrieved successfully");
});

/**
 * @desc    Get counselor monthly earnings
 * @route   GET /api/counselors/earnings/monthly
 * @access  Private (counselor only)
 * @query   period?: number (default: 12, max: 24)
 */
export const getCounselorMonthlyEarnings = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const period = parseInt(req.query.period as string) || 12;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  if (period < 1 || period > 24) {
    throw new ValidationError('Period must be between 1 and 24 months');
  }

  const monthlyEarnings = await CounselorService.getCounselorMonthlyEarnings(counselorId, period);

  ApiResponseUtil.success(res, monthlyEarnings, "Counselor monthly earnings retrieved successfully");
});

/**
 * @desc    Get counselor earnings per client
 * @route   GET /api/counselors/earnings/per-client/:clientId
 * @access  Private (counselor only)
 */
export const getCounselorEarningsPerClient = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const { clientId } = req.params;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  if (!clientId || isNaN(Number(clientId))) {
    throw new ValidationError('Valid client ID is required');
  }

  const earningsPerClient = await CounselorService.getCounselorEarningsPerClient(counselorId, Number(clientId));

  // If clientId is provided, return single object instead of array
  const responseData = clientId ? (earningsPerClient.length > 0 ? earningsPerClient[0] : null) : earningsPerClient;

  ApiResponseUtil.success(res, responseData, "Counselor earnings per client retrieved successfully");
});

/**
 * @desc    Add educational qualification for counselor
 * @route   POST /api/counselors/qualifications
 * @access  Private (counselor only)
 */
export const addCounselorQualification = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const qualificationData = req.body;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  // Ensure the userId in payload matches the authenticated user
  if (qualificationData.userId !== counselorId) {
    throw new ValidationError('User ID mismatch');
  }

  const qualification = await CounselorService.addQualification(counselorId, qualificationData);

  ApiResponseUtil.created(res, { qualification }, "Educational qualification added successfully");
});

/**
 * @desc    Add experience for counselor
 * @route   POST /api/counselors/experiences
 * @access  Private (counselor only)
 */
export const addCounselorExperience = asyncHandler(async (req: Request, res: Response) => {
  const counselorId = req.user?.dbUser.id;
  const experienceData = req.body;

  if (!counselorId) {
    throw new ValidationError('Counselor ID is required');
  }

  // Ensure the userId in payload matches the authenticated user
  if (experienceData.userId !== counselorId) {
    throw new ValidationError('User ID mismatch');
  }

  const experience = await CounselorService.addExperience(counselorId, experienceData);

  ApiResponseUtil.created(res, { experience }, "Experience added successfully");
});