import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import sessionService from '../services/SessionService';
import { PsychiatristService } from '../services/PsychiatristService';
import User from '../models/User';
import { NotificationHelper } from '../utils/NotificationHelper';
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
    const userId = Number(id);
    
    // Get user details to check role
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let result;
    
    if (user.role === 'Counselor') {
      // Get counselor details
      result = await sessionService.getCounselorById(userId);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Counselor not found'
        });
      }
    } else if (user.role === 'Psychiatrist') {
      // Get psychiatrist details
      result = await PsychiatristService.getPsychiatristById(userId);
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching user details'
    });
  }
});

/**
 * @desc    Get all psychiatrists
 * @route   GET /api/sessions/psychiatrists
 * @access  Public
 */
export const getPsychiatrists = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await PsychiatristService.getAllAvailablePsychiatrists();
    
    res.status(200).json({
      success: true,
      data: result.psychiatrists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching psychiatrists'
    });
  }
});

/**
 * @desc    Get psychiatrist details by ID
 * @route   GET /api/sessions/psychiatrists/:id
 * @access  Public
 */
export const getPsychiatristById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const psychiatrist = await PsychiatristService.getPsychiatristById(Number(id));
    
    res.status(200).json({
      success: true,
      data: psychiatrist
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Psychiatrist not found'
      });
    }
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching psychiatrist'
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
    const userId = Number(counselorId);
    
    // Get user details to check role
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let timeSlots;
    
    if (user.role === 'Counselor') {
      // Get counselor time slots
      timeSlots = await sessionService.getAvailableTimeSlots(userId, date);
    } else if (user.role === 'Psychiatrist') {
      // Get psychiatrist time slots (using unified service)
      timeSlots = await sessionService.getAvailableTimeSlots(userId, date);
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
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
 * @desc    Get available time slots for a psychiatrist on a specific date
 * @route   GET /api/sessions/psychiatrist-timeslots/:psychiatristId/:date
 * @access  Public
 */
export const getPsychiatristAvailableTimeSlots = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { psychiatristId, date } = req.params;
    
    const timeSlots = await sessionService.getAvailableTimeSlots(Number(psychiatristId), date);
    
    res.status(200).json({
      success: true,
      data: timeSlots
    });
  } catch (error) {
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching psychiatrist time slots'
    });
  }
});

/**
 * @desc    Get counselor monthly availability (no per-day recursion)
 * @route   GET /api/sessions/counselors/:id/availability/:year/:month
 * @access  Public
 */
export const getCounselorMonthlyAvailability = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id, year, month } = req.params;
    const userId = Number(id);
    const y = Number(year);
    const m = Number(month);
    
    // Get user details to check role
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let result;
    
    if (user.role === 'Counselor') {
      // Get counselor monthly availability
      result = await sessionService.getCounselorMonthlyAvailability(userId, y, m);
    } else if (user.role === 'Psychiatrist') {
      // Get psychiatrist monthly availability (using unified service)
      result = await sessionService.getCounselorMonthlyAvailability(userId, y, m);
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Monthly availability fetched successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch monthly availability'
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

        // Send notifications after successful booking
    try {
      // Get counselor/psychiatrist details
      const professional = await User.findByPk(counselorId);
      if (professional) {
        const professionalName = professional.name;
        const clientName = req.user!.dbUser.name;

        // Format date for notification
        const formattedDate = new Date(date).toLocaleDateString();

        // Notify client
        await NotificationHelper.sessionBooked(userId, professionalName, formattedDate, timeSlot);

        // Notify counselor/psychiatrist
        if (professional.role === 'Counselor') {
          await NotificationHelper.sessionBookedCounselor(counselorId, clientName, formattedDate, timeSlot);
        } else if (professional.role === 'Psychiatrist') {
          await NotificationHelper.sessionBookedPsychiatrist(counselorId, clientName, formattedDate, timeSlot);
        }
      }
    } catch (notificationError) {
      console.error('Failed to send booking notifications:', notificationError);
      // Don't fail the booking if notifications fail
    }

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
    
    // Parse start and end times (format: "HH:00" or "23:59")
    const [startHour] = startTime.split(':').map(Number);
    let [endHour] = endTime.split(':').map(Number);
    
    // If endTime is "23:59", treat as 24:00 to include up to 23:00
    if (endTime === "23:59") {
      endHour = 24;
    }
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 24 || startHour >= endHour) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range'
      });
    }
    
    // Create slots to update (exclusive of endHour - treat as time range, not inclusive)
    const slots = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Exclusive range: startHour to endHour-1 (e.g., 9-10 creates only 9:00)
      for (let hour = startHour; hour < endHour; hour++) {
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
    
    // Parse start and end times (format: "HH:00" or "23:59")
    const [startHour] = startTime.split(':').map(Number);
    let [endHour] = endTime.split(':').map(Number);
    
    // If endTime is "23:59", treat as 24:00 to include up to 23:00
    if (endTime === "23:59") {
      endHour = 24;
    }
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 24 || startHour >= endHour) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range'
      });
    }
    
    // Create slots to update (exclusive of endHour - treat as time range, not inclusive)
    const slots = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Exclusive range: startHour to endHour-1 (e.g., 9-10 creates only 9:00)
      for (let hour = startHour; hour < endHour; hour++) {
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

    // Send cancellation notifications
    try {
      const cancelledBy = req.user!.dbUser.name;
      const recipientId = session.counselorId === userId ? session.userId : session.counselorId;

      // Format date for notification
      const formattedDate = new Date(session.date).toLocaleDateString();

      await NotificationHelper.sessionCancelled(recipientId, formattedDate, session.timeSlot, cancelledBy);
    } catch (notificationError) {
      console.error('Failed to send cancellation notifications:', notificationError);
      // Don't fail the cancellation if notifications fail
    }
    
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
    const userId = Number(id);
    
    // Get user details to check role
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Both counselors and psychiatrists use the same sessions table
    if (user.role === 'Counselor' || user.role === 'Psychiatrist') {
      // Get professional sessions (works for both counselors and psychiatrists)
      const sessions = await sessionService.getCounselorSessions(userId);
      
      res.status(200).json({
        success: true,
        data: sessions
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only counselors and psychiatrists can view their sessions'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching sessions'
    });
  }
});

/**
 * @desc    Get remaining sessions for a student
 * @route   GET /api/sessions/remaining
 * @access  Private
 */
export const getRemainingStudentSessions = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.dbUser.id;
    
    const sessionInfo = await sessionService.getRemainingStudentSessions(userId);
    
    res.status(200).json({
      success: true,
      data: {
        ...sessionInfo,
        message: sessionInfo.isStudent 
          ? `You have ${sessionInfo.remainingSessions} free sessions remaining this month. Your plan resets on ${sessionInfo.nextResetDate}.`
          : "You are not registered as a student. Student benefits are not available."
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching remaining sessions'
    });
  }
});

export const getSessionLink = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.dbUser.id;

    console.log('session id: ', id);

    if(!id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      })
    }

    try {
      const session = await sessionService.getSessionById(Number(id), userId);

      if(!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        })
      }

      const sessionLink = await sessionService.generateSessionLink(session.id, userId);
      
      res.status(200).json({
        success: true,
        data: {
          sessionLink
        }
      });
      
    }catch(e ) {
      return res.status(500).json({
        success: false,
        message: e instanceof Error ? e.message : 'Error fetching session'
      })
    }
});

//get users booked sesisons from today onwards
export const getBooked = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.dbUser.id;

  try {
    const sessions = await sessionService.getBookedSessions(userId);

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching booked sessions'
    });
  }
})

export const updateMeetingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { source, event } = req.body;
  console.log('Received meeting status update:', req.body);

  try {
    await sessionService.updateMeetingStatus(source, event);

    res.status(200).json({
      success: true,
      message: 'Meeting status updated successfully'
    });
  }catch (error) {
    console.error('Error updating meeting status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating meeting status'
    });
  }
})