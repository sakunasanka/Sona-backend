import { Request, Response } from 'express';
import { PsychiatristService } from '../services/PsychiatristService';
import SessionService from '../services/SessionService';
import { CounselorService } from '../services/CounselorServices';
import { ValidationError, ItemNotFoundError } from '../utils/errors';
import Prescription from '../models/Prescription';
import { validateData, updateCounselorProfileSchema } from '../schema/ValidationSchema';
import { asyncHandler } from '../utils/asyncHandler';

// Helper for consistent API responses
const apiResponse = {
  success: (message: string, data?: any) => ({
    success: true,
    message,
    data
  }),
  error: (message: string, error?: string) => ({
    success: false,
    message,
    error
  })
};

/**
 * @desc    Get all available psychiatrists
 * @route   GET /api/psychiatrists/available
 * @access  Public
 */
export const getAvailablePsychiatrists = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await PsychiatristService.getAllAvailablePsychiatrists();
    
    res.status(200).json(apiResponse.success(
      'Psychiatrists fetched successfully',
      result
    ));
  } catch (error) {
    console.error('Error fetching psychiatrists:', error);
    res.status(500).json(apiResponse.error(
      'Failed to fetch psychiatrists',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get psychiatrist by ID
 * @route   GET /api/psychiatrists/:id
 * @access  Public
 */
export const getPsychiatristById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const psychiatristId = parseInt(id);

    if (isNaN(psychiatristId)) {
      res.status(400).json(apiResponse.error(
        'Invalid psychiatrist ID',
        'Psychiatrist ID must be a valid number'
      ));
      return;
    }

    const psychiatrist = await PsychiatristService.getPsychiatristById(psychiatristId);
    
    res.status(200).json(apiResponse.success(
      'Psychiatrist fetched successfully',
      { psychiatrist }
    ));
  } catch (error) {
    console.error('Error fetching psychiatrist:', error);
    
    if (error instanceof ItemNotFoundError) {
      res.status(404).json(apiResponse.error(
        'Psychiatrist not found',
        error.message
      ));
      return;
    }

    res.status(500).json(apiResponse.error(
      'Failed to fetch psychiatrist',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get monthly availability overview
 * @route   GET /api/psychiatrists/:id/availability/:year/:month
 * @access  Public
 */
export const getMonthlyAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, year, month } = req.params;
    const psychiatristId = parseInt(id);
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Validation
    if (isNaN(psychiatristId) || isNaN(yearNum) || isNaN(monthNum)) {
      res.status(400).json(apiResponse.error(
        'Invalid parameters',
        'Psychiatrist ID, year, and month must be valid numbers'
      ));
      return;
    }

    if (monthNum < 1 || monthNum > 12) {
      res.status(400).json(apiResponse.error(
        'Invalid month',
        'Month must be between 1 and 12'
      ));
      return;
    }

    if (yearNum < 2020 || yearNum > 2030) {
      res.status(400).json(apiResponse.error(
        'Invalid year',
        'Year must be between 2020 and 2030'
      ));
      return;
    }

    const availability = await SessionService.getCounselorMonthlyAvailability(
      psychiatristId,
      yearNum,
      monthNum
    );
    
    res.status(200).json(apiResponse.success(
      'Monthly availability fetched successfully',
      availability
    ));
  } catch (error) {
    console.error('Error fetching monthly availability:', error);
    
    if (error instanceof ItemNotFoundError) {
      res.status(404).json(apiResponse.error(
        'Psychiatrist not found',
        error.message
      ));
      return;
    }

    res.status(500).json(apiResponse.error(
      'Failed to fetch monthly availability',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get specific date availability
 * @route   GET /api/psychiatrists/:id/availability/:date
 * @access  Public
 */
export const getDateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, date } = req.params;
    const psychiatristId = parseInt(id);

    if (isNaN(psychiatristId)) {
      res.status(400).json(apiResponse.error(
        'Invalid psychiatrist ID',
        'Psychiatrist ID must be a valid number'
      ));
      return;
    }

    const result = await PsychiatristService.getDateAvailability(psychiatristId, date);
    
    res.status(200).json(apiResponse.success(
      'Availability fetched successfully',
      result
    ));
  } catch (error) {
    console.error('Error fetching date availability:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json(apiResponse.error(
        'Validation error',
        error.message
      ));
      return;
    }

    if (error instanceof ItemNotFoundError) {
      res.status(404).json(apiResponse.error(
        'Psychiatrist not found',
        error.message
      ));
      return;
    }

    res.status(500).json(apiResponse.error(
      'Failed to fetch availability',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get time slots for specific date (requires authentication)
 * @route   GET /api/psychiatrists/:id/timeslots/:date
 * @access  Private
 */
export const getTimeSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, date } = req.params;
    const psychiatristId = parseInt(id);

    if (isNaN(psychiatristId)) {
      res.status(400).json(apiResponse.error(
        'Invalid psychiatrist ID',
        'Psychiatrist ID must be a valid number'
      ));
      return;
    }

    const result = await PsychiatristService.getDateAvailability(psychiatristId, date);
    
    res.status(200).json(apiResponse.success(
      'Time slots fetched successfully',
      result
    ));
  } catch (error) {
    console.error('Error fetching time slots:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json(apiResponse.error(
        'Validation error',
        error.message
      ));
      return;
    }

    if (error instanceof ItemNotFoundError) {
      res.status(404).json(apiResponse.error(
        'Psychiatrist not found',
        error.message
      ));
      return;
    }

    res.status(500).json(apiResponse.error(
      'Failed to fetch time slots',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Book psychiatrist session
 * @route   POST /api/psychiatrists/book
 * @access  Private
 */
export const bookPsychiatristSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.dbUser.id;
    
    if (!userId) {
      res.status(401).json(apiResponse.error(
        'Unauthorized',
        'User authentication required'
      ));
      return;
    }

    const { psychiatristId, date, timeSlot, duration, price, concerns } = req.body;

    // Validation
    if (!psychiatristId || !date || !timeSlot) {
      res.status(400).json(apiResponse.error(
        'Missing required fields',
        'Psychiatrist ID, date, and time slot are required'
      ));
      return;
    }

    if (!duration || duration <= 0) {
      res.status(400).json(apiResponse.error(
        'Invalid duration',
        'Duration must be a positive number'
      ));
      return;
    }

    if (!price || price <= 0) {
      res.status(400).json(apiResponse.error(
        'Invalid price',
        'Price must be a positive number'
      ));
      return;
    }

    const bookingData = {
      psychiatristId: parseInt(psychiatristId),
      date,
      timeSlot,
      duration: parseInt(duration),
      price: parseFloat(price),
      concerns
    };

    const booking = await PsychiatristService.bookPsychiatristSession(userId, bookingData);
    
    res.status(201).json(apiResponse.success(
      'Session booked successfully',
      booking
    ));
  } catch (error) {
    console.error('Error booking session:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json(apiResponse.error(
        'Validation error',
        error.message
      ));
      return;
    }

    if (error instanceof ItemNotFoundError) {
      res.status(404).json(apiResponse.error(
        'Resource not found',
        error.message
      ));
      return;
    }

    res.status(500).json(apiResponse.error(
      'Failed to book session',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get user's psychiatrist sessions
 * @route   GET /api/psychiatrists/my-sessions
 * @access  Private
 */
export const getUserPsychiatristSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.dbUser.id;
    
    if (!userId) {
      res.status(401).json(apiResponse.error(
        'Unauthorized',
        'User authentication required'
      ));
      return;
    }

    const sessions = await PsychiatristService.getUserSessions(userId);
    
    res.status(200).json(apiResponse.success(
      'User sessions fetched successfully',
      { sessions, count: sessions.length }
    ));
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    
    res.status(500).json(apiResponse.error(
      'Failed to fetch sessions',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get psychiatrist's sessions (for psychiatrists only)
 * @route   GET /api/psychiatrists/:id/sessions
 * @access  Private (Psychiatrist only)
 */
export const getPsychiatristSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.dbUser.id;
    const userRole = req.user?.dbUser.userType;
    const { id } = req.params;
    const psychiatristId = parseInt(id);

    if (!userId) {
      res.status(401).json(apiResponse.error(
        'Unauthorized',
        'User authentication required'
      ));
      return;
    }

    // Check if user is the psychiatrist or has admin privileges
    if (userRole !== 'Admin' && userId !== psychiatristId) {
      res.status(403).json(apiResponse.error(
        'Forbidden',
        'You can only view your own sessions'
      ));
      return;
    }

    if (isNaN(psychiatristId)) {
      res.status(400).json(apiResponse.error(
        'Invalid psychiatrist ID',
        'Psychiatrist ID must be a valid number'
      ));
      return;
    }

    const sessions = await PsychiatristService.getPsychiatristSessions(psychiatristId);
    
    res.status(200).json(apiResponse.success(
      'Psychiatrist sessions fetched successfully',
      { sessions, count: sessions.length }
    ));
  } catch (error) {
    console.error('Error fetching psychiatrist sessions:', error);
    
    res.status(500).json(apiResponse.error(
      'Failed to fetch sessions',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Cancel a psychiatrist session
 * @route   PUT /api/psychiatrists/sessions/:id/cancel
 * @access  Private
 */
export const cancelPsychiatristSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.dbUser.id;
    const userRole = req.user?.dbUser.userType;
    const { id } = req.params;
    const sessionId = parseInt(id);

    if (!userId) {
      res.status(401).json(apiResponse.error(
        'Unauthorized',
        'User authentication required'
      ));
      return;
    }

    if (isNaN(sessionId)) {
      res.status(400).json(apiResponse.error(
        'Invalid session ID',
        'Session ID must be a valid number'
      ));
      return;
    }

    // Determine who is cancelling
    const cancelledBy = userRole === 'Psychiatrist' ? 'psychiatrist' : 'user';
    
    const result = await PsychiatristService.cancelSession(sessionId, cancelledBy);
    
    res.status(200).json(apiResponse.success(
      'Session cancelled successfully',
      result
    ));
  } catch (error) {
    console.error('Error cancelling session:', error);
    
    if (error instanceof ItemNotFoundError) {
      res.status(404).json(apiResponse.error(
        'Session not found',
        error.message
      ));
      return;
    }

    res.status(500).json(apiResponse.error(
      'Failed to cancel session',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get upcoming sessions count for user
 * @route   GET /api/psychiatrists/upcoming-count
 * @access  Private
 */
export const getUpcomingSessionsCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.dbUser.id;
    
    if (!userId) {
      res.status(401).json(apiResponse.error(
        'Unauthorized',
        'User authentication required'
      ));
      return;
    }

    const count = await PsychiatristService.getUpcomingSessionsCount(userId);
    
    res.status(200).json(apiResponse.success(
      'Upcoming sessions count fetched successfully',
      { upcomingSessionsCount: count }
    ));
  } catch (error) {
    console.error('Error fetching upcoming sessions count:', error);
    
    res.status(500).json(apiResponse.error(
      'Failed to fetch upcoming sessions count',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get all psychiatrists (for admin)
 * @route   GET /api/psychiatrists/
 * @access  Private (Admin only)
 */
export const getAllPsychiatrists = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await PsychiatristService.getAllPsychiatrists();
    
    res.status(200).json(apiResponse.success(
      'All psychiatrists fetched successfully',
      result
    ));
  } catch (error) {
    console.error('Error fetching all psychiatrists:', error);
    res.status(500).json(apiResponse.error(
      'Failed to fetch psychiatrists',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Update psychiatrist availability
 * @route   PATCH /api/psychiatrists/:id/availability
 * @access  Private (Psychiatrist only)
 */
export const updatePsychiatristAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const psychiatristId = parseInt(id);

    if (isNaN(psychiatristId)) {
      res.status(400).json(apiResponse.error(
        'Invalid psychiatrist ID',
        'Psychiatrist ID must be a valid number'
      ));
      return;
    }

    if (typeof isAvailable !== 'boolean') {
      res.status(400).json(apiResponse.error(
        'Invalid availability value',
        'isAvailable must be a boolean value'
      ));
      return;
    }

    const psychiatrist = await PsychiatristService.updatePsychiatristAvailability(psychiatristId, isAvailable);
    
    res.status(200).json(apiResponse.success(
      'Psychiatrist availability updated successfully',
      { psychiatrist }
    ));
  } catch (error) {
    console.error('Error updating psychiatrist availability:', error);
    
    if (error instanceof ItemNotFoundError) {
      res.status(404).json(apiResponse.error(
        'Psychiatrist not found',
        error.message
      ));
      return;
    }

    res.status(500).json(apiResponse.error(
      'Failed to update availability',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Update psychiatrist status (approve/reject)
 * @route   PATCH /api/psychiatrists/:id/status
 * @access  Private (Admin only)
 */
// export const updatePsychiatristStatus = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
//     const psychiatristId = parseInt(id);

//     if (isNaN(psychiatristId)) {
//       res.status(400).json(apiResponse.error(
//         'Invalid psychiatrist ID',
//         'Psychiatrist ID must be a valid number'
//       ));
//       return;
//     }

//     if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
//       res.status(400).json(apiResponse.error(
//         'Invalid status',
//         'Status must be one of: approved, rejected, pending'
//       ));
//       return;
//     }

//     const psychiatrist = await PsychiatristService.updatePsychiatristStatus(psychiatristId, status);
    
//     res.status(200).json(apiResponse.success(
//       'Psychiatrist status updated successfully',
//       { psychiatrist }
//     ));
//   } catch (error) {
//     console.error('Error updating psychiatrist status:', error);
    
    if (error instanceof ItemNotFoundError) {
      res.status(404).json(apiResponse.error(
        'Psychiatrist not found',
        error.message
      ));
      return;
    }

    res.status(500).json(apiResponse.error(
      'Failed to update status',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Upload a prescription
 * @route   POST /api/psychiatrists/prescription
 * @access  Private (Psychiatrist only)
 */
export const uploadPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.dbUser?.id;
    const userRole = (req as any).user?.dbUser?.userType;

    if (!userId) {
      res.status(401).json(apiResponse.error(
        'Unauthorized',
        'User authentication required'
      ));
      return;
    }

    if (userRole !== 'Psychiatrist') {
      res.status(403).json(apiResponse.error(
        'Forbidden',
        'Only psychiatrists can upload prescriptions'
      ));
      return;
    }

    const { clientId, description, prescription } = req.body;

    if (!clientId || !prescription) {
      res.status(400).json(apiResponse.error(
        'Missing required fields',
        'Client ID and prescription URL are required'
      ));
      return;
    }

    // Create the prescription
    const newPrescription = await Prescription.create({
      psychiatristId: userId,
      clientId: parseInt(clientId),
      description,
      prescription
    });

    res.status(201).json(apiResponse.success(
      'Prescription uploaded successfully',
      {
        id: newPrescription.id,
        psychiatristId: newPrescription.psychiatristId,
        clientId: newPrescription.clientId,
        description: newPrescription.description,
        prescription: newPrescription.prescription,
        createdAt: newPrescription.createdAt
      }
    ));
  } catch (error) {
    console.error('Error uploading prescription:', error);
    res.status(500).json(apiResponse.error(
      'Failed to upload prescription',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Get all prescriptions by psychiatrist for a specific client
 * @route   GET /api/psychiatrists/prescriptions/:clientId
 * @access  Private (Psychiatrist only)
 */
export const getPrescriptionsByPsychiatrist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.dbUser?.id;
    const userRole = (req as any).user?.dbUser?.userType;
    const { clientId } = req.params;

    if (!userId) {
      res.status(401).json(apiResponse.error(
        'Unauthorized',
        'User authentication required'
      ));
      return;
    }

    if (userRole !== 'Psychiatrist') {
      res.status(403).json(apiResponse.error(
        'Forbidden',
        'Only psychiatrists can view their prescriptions'
      ));
      return;
    }

    const clientIdNum = parseInt(clientId);
    if (isNaN(clientIdNum)) {
      res.status(400).json(apiResponse.error(
        'Invalid client ID',
        'Client ID must be a valid number'
      ));
      return;
    }

    // Get all prescriptions by this psychiatrist for the specific client
    const prescriptions = await Prescription.findAll({
      where: { 
        psychiatristId: userId,
        clientId: clientIdNum
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: require('../models/User').default,
          as: 'client',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json(apiResponse.success(
      'Prescriptions fetched successfully',
      {
        prescriptions,
        count: prescriptions.length,
        clientId: clientIdNum
      }
    ));
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json(apiResponse.error(
      'Failed to fetch prescriptions',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
};

/**
 * @desc    Update psychiatrist profile
 * @route   PUT /api/psychiatrists/profile
 * @access  Private (Psychiatrist only)
 */
export const updatePsychiatristProfile = asyncHandler(async (req: Request, res: Response) => {
  const psychiatristId = req.user?.dbUser.id;

  if (!psychiatristId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'User authentication required'
    });
    return;
  }

  const validatedData = await validateData(updateCounselorProfileSchema, req.body);

  const updatedProfile = await CounselorService.updateCounselorProfile(psychiatristId, validatedData);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile
  });
});
