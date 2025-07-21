import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import sessionService from '../services/SessionService';
/**
 * @desc    Get all counselors
 * @route   GET /api/sessions/counselors
 * @access  Public
 */
export const getCounselors = asyncHandler(async (req: Request, res: Response) => {
  try {
    const counselors = await sessionService.getCounselors();
    
    res.status(200).json({
      success: true,
      data: counselors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching counselors'
    });
  }
});

/**
 * @desc    Get counselor details by ID
 * @route   GET /api/sessions/counselors/:id
 * @access  Public
 */
export const getCounselorById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const counselor = await sessionService.getCounselorById(Number(id));
    
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: counselor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching counselor'
    });
  }
});

/**
 * @desc    Get available time slots for a counselor on a specific date
 * @route   GET /api/sessions/timeslots/:counselorId/:date
 * @access  Public
 */
export const getAvailableTimeSlots = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { counselorId, date } = req.params;
    
    const timeSlots = await sessionService.getAvailableTimeSlots(Number(counselorId), date);
    
    res.status(200).json({
      success: true,
      data: timeSlots
    });
  } catch (error) {
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching time slots'
    });
  }
});


/**
 * @desc    Book a new session
 * @route   POST /api/sessions/book
 * @access  Private
 */
export const bookSession = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.dbUser.id;
    const {
      counselorId,
      date,
      timeSlot,
      duration,
      price
    } = req.body;
    
    const session = await sessionService.bookSession({
      userId,
      counselorId,
      date,
      timeSlot,
      duration,
      price
    });
    
    res.status(201).json({
      success: true,
      message: 'Session booked successfully',
      data: session
    });
  } catch (error) {
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error booking session'
    });
  }
});

/**
 * @desc    Get user's booked sessions
 * @route   GET /api/sessions/my-sessions
 * @access  Private
 */
export const getUserSessions = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.dbUser.id;
    
    const sessions = await sessionService.getUserSessions(userId);
    
    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching sessions'
    });
  }
});

/**
 * @desc    Get specific session details
 * @route   GET /api/sessions/:id
 * @access  Private
 */
export const getSessionById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.dbUser.id;
    const { id } = req.params;
    
    const session = await sessionService.getSessionById(Number(id), userId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching session'
    });
  }
});

/**
 * @desc    Set counselor availability for a date range
 * @route   POST /api/sessions/availability
 * @access  Private (counselor only)
 */
export const setCounselorAvailability = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { Counselorid, startDate, endDate, startTime, endTime } = req.body;
    
    // Validate required fields
    if (!Counselorid || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Counselorid, start date, end date, start time, and end time are required'
      });
    }
    
    // Convert to number for database query
    const counselorId = Number(Counselorid);
    
    // Parse dates and times
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate date range
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }
    
    // Parse start and end times (format: "HH:00")
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23 || startHour > endHour) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range'
      });
    }
    
    // Create slots to update
    const slots = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      for (let hour = startHour; hour <= endHour; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        slots.push({ date: dateString, time: timeString });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const updatedSlots = await sessionService.setCounselorAvailability(counselorId, slots);
    
    res.status(200).json({
      success: true,
      message: `Successfully set availability for ${updatedSlots.length} time slots`,
      data: updatedSlots
    });
  } catch (error) {
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error setting availability'
    });
  }
});

/**
 * @desc    Set counselor unavailability for a date range
 * @route   POST /api/sessions/unavailability
 * @access  Public
 */
export const setCounselorUnavailability = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { Counselorid, startDate, endDate, startTime, endTime } = req.body;
    
    // Validate required fields
    if (!Counselorid || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Counselorid, start date, end date, start time, and end time are required'
      });
    }
    
    // Convert to number for database query
    const counselorId = Number(Counselorid);
    
    // Parse dates and times
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate date range
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }
    
    // Parse start and end times (format: "HH:00")
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23 || startHour > endHour) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range'
      });
    }
    
    // Create slots to update
    const slots = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      for (let hour = startHour; hour <= endHour; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        slots.push({ date: dateString, time: timeString });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const updatedSlots = await sessionService.setCounselorUnavailability(counselorId, slots);
    
    res.status(200).json({
      success: true,
      message: `Successfully marked ${updatedSlots.length} time slots as unavailable`,
      data: updatedSlots
    });
  } catch (error) {
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error setting unavailability'
    });
  }
});

/**
 * @desc    Cancel a session
 * @route   PUT /api/sessions/:id/cancel
 * @access  Private
 */
export const cancelSession = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.dbUser.id;
    const { id } = req.params;
    
    const session = await sessionService.cancelSession(Number(id), userId);
    
    res.status(200).json({
      success: true,
      message: 'Session cancelled successfully',
      data: session
    });
  } catch (error) {
    res.status(error instanceof Error && 
      (error.message.includes('not found') || error.message.includes('cannot be cancelled')) ? 404 : 400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error cancelling session'
    });
  }
});

/**
 * @desc    Get counselor's sessions
 * @route   GET /api/sessions/counselor/:id/sessions
 * @access  Private (counselor only)
 */
export const getCounselorSessions = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Ensure the requesting user is the counselor
    // if (req.user!.dbUser.id !== Number(id)) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized: You can only view your own sessions'
    //   });
    // }
    
    const sessions = await sessionService.getCounselorSessions(Number(id));
    
    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching counselor sessions'
    });
  }
});
