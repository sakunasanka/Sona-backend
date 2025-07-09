import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import Session from '../models/Session';
import User from '../models/User';
import Counselor from '../models/Counselor';
import SessionType from '../models/SessionType';
import TimeSlot from '../models/TimeSlot';
import PaymentMethod from '../models/PaymentMethod';
import { Op } from 'sequelize';

/**
 * @desc    Get all session types
 * @route   GET /api/sessions/types
 * @access  Public
 */
export const getSessionTypes = asyncHandler(async (req: Request, res: Response) => {
  const sessionTypes = await SessionType.findAll();
  
  if (!sessionTypes.length) {
    // If no session types exist, create default ones
    await createDefaultSessionTypes();
    const newSessionTypes = await SessionType.findAll();
    return res.status(200).json({
      success: true,
      data: newSessionTypes
    });
  }
  
  res.status(200).json({
    success: true,
    data: sessionTypes
  });
});

/**
 * @desc    Get all counselors
 * @route   GET /api/sessions/counselors
 * @access  Public
 */
export const getCounselors = asyncHandler(async (req: Request, res: Response) => {
  const counselors = await Counselor.findAll({
    include: [
      {
        model: User,
        attributes: ['id', 'name', 'avatar']
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: counselors
  });
});

/**
 * @desc    Get counselor details by ID
 * @route   GET /api/sessions/counselors/:id
 * @access  Public
 */
export const getCounselorById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const counselor = await Counselor.findByPk(id, {
    include: [
      {
        model: User,
        attributes: ['id', 'name', 'avatar']
      }
    ]
  });
  
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
});

/**
 * @desc    Get available time slots for a counselor on a specific date
 * @route   GET /api/sessions/timeslots/:counselorId/:date
 * @access  Public
 */
export const getAvailableTimeSlots = asyncHandler(async (req: Request, res: Response) => {
  const { counselorId, date } = req.params;
  
  // First check if the counselor exists
  const counselor = await Counselor.findByPk(counselorId);
  if (!counselor) {
    return res.status(404).json({
      success: false,
      message: 'Counselor not found'
    });
  }
  
  // Get all time slots for this counselor on this date
  const timeSlots = await TimeSlot.findAll({
    where: {
      counselorId,
      date,
      isBooked: false
    }
  });
  
  // If no time slots exist, generate default ones
  if (!timeSlots.length) {
    const parsedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (parsedDate.getTime() < today.getTime()) {
      // Don't generate slots for past days
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const isToday = parsedDate.toDateString() === today.toDateString();
    const currentHour = new Date().getHours();
    
    // Generate default time slots (9 AM to 5 PM)
    const defaultTimeSlots = [];
    for (let hour = 9; hour <= 17; hour++) {
      // If it's today, only show future time slots
      if (isToday && hour <= currentHour + 1) continue;
      
      const timeSlot = await TimeSlot.create({
        counselorId,
        date,
        time: `${hour.toString().padStart(2, '0')}:00`,
        isBooked: false
      });
      
      defaultTimeSlots.push(timeSlot);
    }
    
    return res.status(200).json({
      success: true,
      data: defaultTimeSlots
    });
  }
  
  res.status(200).json({
    success: true,
    data: timeSlots
  });
});

/**
 * @desc    Get user payment methods
 * @route   GET /api/sessions/payment-methods
 * @access  Private
 */
export const getUserPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.dbUser.id;
  
  const paymentMethods = await PaymentMethod.findAll({
    where: { userId }
  });
  
  res.status(200).json({
    success: true,
    data: paymentMethods
  });
});

/**
 * @desc    Add new payment method
 * @route   POST /api/sessions/payment-methods
 * @access  Private
 */
export const addPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.dbUser.id;
  const { type, last4, brand, isDefault } = req.body;
  
  // Validate required fields
  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Payment type is required'
    });
  }
  
  // If this is the default payment method, update all others to non-default
  if (isDefault) {
    await PaymentMethod.update(
      { isDefault: false },
      { where: { userId } }
    );
  }
  
  // Create new payment method
  const paymentMethod = await PaymentMethod.create({
    userId,
    type,
    last4,
    brand,
    isDefault: isDefault || false
  });
  
  res.status(201).json({
    success: true,
    data: paymentMethod
  });
});

/**
 * @desc    Book a new session
 * @route   POST /api/sessions
 * @access  Private
 */
export const bookSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.dbUser.id;
  const {
    counselorId,
    sessionTypeId,
    date,
    timeSlot,
    duration,
    price,
    concerns,
    paymentMethodId
  } = req.body;
  
  // Validate required fields
  if (!counselorId || !sessionTypeId || !date || !timeSlot || !price) {
    return res.status(400).json({
      success: false,
      message: 'Required session information is missing'
    });
  }
  
  // Check if counselor exists
  const counselor = await Counselor.findByPk(counselorId);
  if (!counselor) {
    return res.status(404).json({
      success: false,
      message: 'Counselor not found'
    });
  }
  
  // Check if session type exists
  const sessionType = await SessionType.findByPk(sessionTypeId);
  if (!sessionType) {
    return res.status(404).json({
      success: false,
      message: 'Session type not found'
    });
  }
  
  // Check if time slot is available
  const slot = await TimeSlot.findOne({
    where: {
      counselorId,
      date,
      time: timeSlot,
      isBooked: false
    }
  });
  
  if (!slot) {
    return res.status(400).json({
      success: false,
      message: 'Time slot is not available'
    });
  }
  
  // Check if payment method exists if provided
  if (paymentMethodId) {
    const paymentMethod = await PaymentMethod.findOne({
      where: {
        id: paymentMethodId,
        userId
      }
    });
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
  }
  
  // Create the session booking
  const session = await Session.create({
    userId,
    counselorId,
    sessionTypeId,
    date,
    timeSlot,
    duration: duration || sessionType.duration,
    price,
    concerns,
    status: 'scheduled',
    paymentMethodId
  });
  
  // Mark the time slot as booked
  await slot.update({ isBooked: true });
  
  res.status(201).json({
    success: true,
    message: 'Session booked successfully',
    data: session
  });
});

/**
 * @desc    Get user's booked sessions
 * @route   GET /api/sessions/my-sessions
 * @access  Private
 */
export const getUserSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.dbUser.id;
  // Hardcoding userId for testing purposes
//   const userId = 1;
  
  const sessions = await Session.findAll({
    where: { userId },
    include: [
      {
        model: User,
        as: 'counselor',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: SessionType,
        attributes: ['id', 'name', 'description', 'duration']
      }
    ],
    order: [['date', 'ASC'], ['timeSlot', 'ASC']]
  });
  
  res.status(200).json({
    success: true,
    data: sessions
  });
});

/**
 * @desc    Get specific session details
 * @route   GET /api/sessions/:id
 * @access  Private
 */
export const getSessionById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.dbUser.id;
  const { id } = req.params;
  
  const session = await Session.findOne({
    where: {
      id,
      [Op.or]: [
        { userId },
        { counselorId: userId } // Allow both user and counselor to view session
      ]
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: User,
        as: 'counselor',
        attributes: ['id', 'name', 'avatar'],
        include: [
          {
            model: Counselor,
            attributes: ['title', 'specialties', 'rating']
          }
        ]
      },
      {
        model: SessionType,
        attributes: ['id', 'name', 'description', 'duration']
      }
    ]
  });
  
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
});

/**
 * @desc    Cancel a session
 * @route   PUT /api/sessions/:id/cancel
 * @access  Private
 */
export const cancelSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.dbUser.id;
  const { id } = req.params;
  
  const session = await Session.findOne({
    where: {
      id,
      userId,
      status: 'scheduled'
    }
  });
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found or cannot be cancelled'
    });
  }
  
  // Check if session is within cancellation period (e.g., 24 hours before)
  const sessionDate = new Date(`${session.date}T${session.timeSlot}`);
  const now = new Date();
  const hoursDifference = Math.round((sessionDate.getTime() - now.getTime()) / (60 * 60 * 1000));
  
  if (hoursDifference < 24) {
    return res.status(400).json({
      success: false,
      message: 'Sessions can only be cancelled at least 24 hours in advance'
    });
  }
  
  // Update session status
  await session.update({ status: 'cancelled' });
  
  // Free up the time slot
  await TimeSlot.update(
    { isBooked: false },
    {
      where: {
        counselorId: session.counselorId,
        date: session.date,
        time: session.timeSlot
      }
    }
  );
  
  res.status(200).json({
    success: true,
    message: 'Session cancelled successfully'
  });
});

// Helper function to create default session types
async function createDefaultSessionTypes() {
  const sessionTypes = [
    {
      id: 'video',
      name: 'Video Call',
      description: 'Secure video session from anywhere',
      duration: 50,
      price: 80
    },
    {
      id: 'phone',
      name: 'Phone Call',
      description: 'Traditional phone consultation',
      duration: 50,
      price: 75
    },
    {
      id: 'chat',
      name: 'Text Chat',
      description: 'Secure messaging session',
      duration: 50,
      price: 65
    }
  ];
  
  await Promise.all(sessionTypes.map(type => SessionType.create(type)));
}