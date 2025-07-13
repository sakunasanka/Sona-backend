import { Op } from 'sequelize';
import Session from '../models/Session';
import User from '../models/User';
import Counselor from '../models/Counselor';
import TimeSlot from '../models/TimeSlot';
import PaymentMethod from '../models/PaymentMethod';

export interface BookSessionParams {
  userId: number;
  counselorId: number;
  sessionTypeId: string;
  date: string;
  timeSlot: string;
  duration?: number;
  price: number;
  concerns?: string;
  paymentMethodId?: number | string;
}

export interface TimeSlotData {
  date: string;
  time: string;
}

class SessionService {

  /**
   * Get all counselors
   */
  async getCounselors(): Promise<Counselor[]> {
    return Counselor.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });
  }

  /**
   * Get counselor by ID
   */
  async getCounselorById(id: number): Promise<Counselor | null> {
    return Counselor.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });
  }

  /**
   * Get available time slots for a counselor on a specific date
   */
  async getAvailableTimeSlots(counselorId: number, date: string): Promise<TimeSlot[]> {
    // First check if the counselor exists
    const counselor = await Counselor.findByPk(counselorId);
    if (!counselor) {
      throw new Error('Counselor not found');
    }
    
    // Get all time slots for this counselor on this date
    const timeSlots = await TimeSlot.findAll({
      where: {
        counselorId,
        date,
        isBooked: false,
        isAvailable: true
      }
    });
    
    // If no time slots exist, generate default ones
    if (!timeSlots.length) {
      const parsedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (parsedDate.getTime() < today.getTime()) {
        // Don't generate slots for past days
        return [];
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
          isBooked: false,
          isAvailable: false // Not available by default
        });
        
        defaultTimeSlots.push(timeSlot);
      }
      
      return defaultTimeSlots;
    }
    
    return timeSlots;
  }

  /**
   * Get user payment methods
   */
  async getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return PaymentMethod.findAll({
      where: { userId }
    });
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(
    userId: number, 
    transactionId: string,
    amount: number,
    currency: string = 'USD',
    status: 'pending' | 'completed' | 'failed' | 'refunded' = 'completed'
  ): Promise<PaymentMethod> {
    // Validate required fields
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }
    
    // Create new payment method
    return PaymentMethod.create({
      userId,
      transactionId,
      paymentGateway: 'payhere',
      amount,
      currency,
      status,
      paymentDate: new Date()
    });
  }

  /**
   * Book a new session
   */
  async bookSession(params: BookSessionParams): Promise<Session> {
    const {
      userId,
      counselorId,
      sessionTypeId,
      date,
      timeSlot,
      duration,
      price,
      concerns,
      paymentMethodId
    } = params;

    // Check if counselor exists
    const counselor = await Counselor.findByPk(counselorId);
    if (!counselor) {
      throw new Error('Counselor not found');
    }
    
    // Check if time slot is available
    const slot = await TimeSlot.findOne({
      where: {
        counselorId,
        date,
        time: timeSlot,
        isBooked: false,
        isAvailable: true
      }
    });
    
    if (!slot) {
      throw new Error('Time slot is not available');
    }
    
    // Check if payment method exists if provided
    if (paymentMethodId) {
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          paymentId: Number(paymentMethodId),
          userId
        }
      });
      
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
    }
    
    // Create the session booking
    const session = await Session.create({
      userId,
      counselorId,
      sessionTypeId,
      date,
      timeSlot,
      duration: duration || 50, // Default to 50 minutes if not provided
      price,
      concerns,
      status: 'scheduled',
      paymentMethodId
    });
    
    // Mark the time slot as booked
    await slot.update({ isBooked: true });
    
    return session;
  }

  /**
   * Get user's booked sessions
   */
  async getUserSessions(userId: number): Promise<Session[]> {
    return Session.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['date', 'ASC'], ['timeSlot', 'ASC']]
    });
  }

  /**
   * Get specific session details
   */
  async getSessionById(sessionId: number, userId: number): Promise<Session | null> {
    return Session.findOne({
      where: {
        id: sessionId,
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
        }
      ]
    });
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: number, userId: number): Promise<Session> {
    const session = await Session.findOne({
      where: {
        id: sessionId,
        [Op.or]: [
          { userId },
          { counselorId: userId }
        ],
        status: 'scheduled' // Can only cancel scheduled sessions
      }
    });
    
    if (!session) {
      throw new Error('Session not found or cannot be cancelled');
    }
    
    // Check if session is within cancellation period (e.g., 24 hours before)
    const sessionDate = new Date(`${session.date}T${session.timeSlot}`);
    const now = new Date();
    const hoursDifference = Math.round((sessionDate.getTime() - now.getTime()) / (60 * 60 * 1000));
    
    if (hoursDifference < 24) {
      throw new Error('Sessions can only be cancelled at least 24 hours in advance');
    }
    
    // Update session status
    await session.update({ status: 'cancelled' });
    
    // Free up the time slot (keep the availability status)
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
    
    return session;
  }

  /**
   * Set counselor availability for a date range
   */
  async setCounselorAvailability(
    counselorId: number, 
    slots: TimeSlotData[]
  ): Promise<TimeSlot[]> {
    const updatedSlots: TimeSlot[] = [];
    
    for (const { date, time } of slots) {
      const [slot, created] = await TimeSlot.findOrCreate({
        where: {
          counselorId,
          date,
          time
        },
        defaults: {
          isAvailable: true,
          isBooked: false
        }
      });
      
      if (!created && !slot.isBooked) {
        await slot.update({ isAvailable: true });
      }
      
      updatedSlots.push(slot);
    }
    
    return updatedSlots;
  }

  /**
   * Set counselor unavailability for a date range
   */
  async setCounselorUnavailability(
    counselorId: number, 
    slots: TimeSlotData[]
  ): Promise<TimeSlot[]> {
    const updatedSlots: TimeSlot[] = [];
    
    for (const { date, time } of slots) {
      const slot = await TimeSlot.findOne({
        where: {
          counselorId,
          date,
          time,
          isBooked: false // Can't make booked slots unavailable
        }
      });
      
      if (slot) {
        await slot.update({ isAvailable: false });
        updatedSlots.push(slot);
      }
    }
    
    return updatedSlots;
  }
}

export default new SessionService();
