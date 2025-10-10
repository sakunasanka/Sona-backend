import { Op, QueryTypes } from 'sequelize';
import Session from '../models/Session';
import User from '../models/User';
import Counselor from '../models/Counselor';
import Client from '../models/Client';
import TimeSlot from '../models/TimeSlot';
import PaymentMethod from '../models/PaymentMethod';
import { sequelize } from '../config/db'; // Fixed import for sequelize

export interface BookSessionParams {
  userId: number;
  counselorId: number;
  date: string;
  timeSlot: string;
  duration?: number;
  price: number;
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
      date,
      timeSlot,
      duration,
      price
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

    // If price is 0, check if the user is a student and has free sessions available
    let finalPrice = price;
    if (price === 0) {
      // Check if user is a student
      const client = await sequelize.query(
        `SELECT "isStudent", "userId" FROM clients WHERE "userId" = ?`,
        {
          replacements: [userId],
          type: QueryTypes.SELECT
        }
      );
      
      const isStudent = client.length > 0 && (client[0] as any).isStudent === true;
      
      if (isStudent) {
        // Get remaining free sessions
        const { remainingSessions } = await this.getRemainingStudentSessions(userId);
        
        if (remainingSessions <= 0) {
          throw new Error('No free sessions remaining this month. Please book a paid session.');
        }
        
        // Free session is available, keep price as 0
      } else {
        throw new Error('Free sessions are only available for students.');
      }
    }
    
    // Create the session booking
    const session = await Session.create({
      userId,
      counselorId,
      date,
      timeSlot,
      duration: duration || 50, // Default to 50 minutes if not provided
      price: finalPrice,
      status: 'scheduled'
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
    const sessionQuery = `
      SELECT
        s.*,
        CASE
          WHEN u.role = 'Client' AND c."nickName" IS NOT NULL THEN c."nickName"
          ELSE u.name
        END as user_name,
        u.avatar as user_avatar,
        u.role as user_role,
        u.id as user_id,
        cu.name as counselor_name,
        cu.avatar as counselor_avatar,
        cu.role as counselor_role,
        cu.id as counselor_id,
        co.title as counselor_title,
        co.specialties as counselor_specialties,
        co.rating as counselor_rating
      FROM sessions s
      JOIN users u ON s."userId" = u.id
      LEFT JOIN clients c ON u.id = c."userId"
      JOIN users cu ON s."counselorId" = cu.id
      LEFT JOIN counselors co ON cu.id = co."userId"
      WHERE s.id = :sessionId
      AND (s."userId" = :userId OR s."counselorId" = :userId)
    `;

    const result = await sequelize.query(sessionQuery, {
      replacements: { sessionId, userId },
      type: QueryTypes.SELECT,
      model: Session,
      mapToModel: true
    });

    if (result.length === 0) {
      return null;
    }

    const session = result[0] as any;

    // Construct the proper nested structure
    return {
      ...session.toJSON(),
      user: {
        id: session.get('user_id'),
        name: session.get('user_name'),
        avatar: session.get('user_avatar'),
        role: session.get('user_role')
      },
      counselor: {
        id: session.get('counselor_id'),
        name: session.get('counselor_name'),
        avatar: session.get('counselor_avatar'),
        role: session.get('counselor_role'),
        Counselor: {
          title: session.get('counselor_title'),
          specialties: session.get('counselor_specialties'),
          rating: session.get('counselor_rating')
        }
      }
    } as Session;
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
      const [slot, created] = await TimeSlot.findOrCreate({
        where: {
          counselorId,
          date,
          time
        },
        defaults: {
          isAvailable: false,
          isBooked: false
        }
      });
      
      // Only update if not booked (can't make booked slots unavailable)
      if (!slot.isBooked) {
        if (!created) {
          await slot.update({ isAvailable: false });
        }
        updatedSlots.push(slot);
      }
    }
    
    return updatedSlots;
  }

  /**
   * Get counselor monthly availability (grouped by date)
   */
  async getCounselorMonthlyAvailability(
    counselorId: number,
    year: number,
    month: number
  ): Promise<{
    counselorId: number;
    year: number;
    month: number;
    availability: Array<{ date: string; slots: Array<{ id: number; time: string; isAvailable: boolean; isBooked: boolean }> }>;
  }> {
    // Validate inputs
    if (!counselorId || !year || !month || month < 1 || month > 12) {
      throw new Error('Invalid counselorId, year or month');
    }

    // Compute month range
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0)); // last day of month
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    // Fetch all time slots within range
    const slots = await TimeSlot.findAll({
      where: {
        counselorId,
        date: { [Op.between]: [start, end] }
      },
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    // Group by date
    const grouped = new Map<string, Array<{ id: number; time: string; isAvailable: boolean; isBooked: boolean }>>();
    for (const s of slots) {
      const date = (s as any).date as string;
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date)!.push({
        id: (s as any).id,
        time: (s as any).time,
        isAvailable: (s as any).isAvailable,
        isBooked: (s as any).isBooked
      });
    }

    const availability = Array.from(grouped.entries()).map(([date, daySlots]) => ({
      date,
      slots: daySlots
    }));

    return {
      counselorId,
      year,
      month,
      availability
    };
  }

  /**
   * Get counselor's sessions
   */
  async getCounselorSessions(counselorId: number): Promise<(Session & { isStudent?: boolean })[]> {
    const sessionsQuery = `
      SELECT 
        s.*,
        CASE
          WHEN u.role = 'Client' AND c."nickName" IS NOT NULL THEN c."nickName"
          ELSE u.name
        END as user_name,
        u.avatar as user_avatar,
        u.role as user_role,
        u.id as user_id,
        CASE
          WHEN u.role = 'Client' AND c."nickName" IS NOT NULL THEN c."nickName"
          ELSE u.name
        END as client_display_name
      FROM sessions s
      JOIN users u ON s."userId" = u.id
      LEFT JOIN clients c ON u.id = c."userId"
      WHERE s."counselorId" = :counselorId
      ORDER BY s.date ASC, s."timeSlot" ASC
    `;

    const sessions = await sequelize.query(sessionsQuery, {
      replacements: { counselorId },
      type: QueryTypes.SELECT,
      model: Session,
      mapToModel: true
    });

    // Get userIds from sessions
    const userIds = sessions.map((s: any) => s.userId);

    // Query isStudent status for all users in clients table
    const clientRows = await sequelize.query(
      `SELECT "userId", "isStudent" FROM clients WHERE "userId" IN (:userIds)`,
      {
        replacements: { userIds },
        type: QueryTypes.SELECT
      }
    );

    // Map userId to isStudent
    const isStudentMap = new Map<number, boolean>();
    for (const row of clientRows as any[]) {
      isStudentMap.set(row.userId, row.isStudent === true);
    }

    // Attach isStudent to each session
    return sessions.map((session: any) => ({
      ...session.toJSON(),
      user: {
        id: session.get('user_id'),
        name: session.get('user_name'),
        avatar: session.get('user_avatar'),
        role: session.get('user_role')
      },
      isStudent: isStudentMap.get(session.userId) || false
    })) as (Session & { isStudent?: boolean })[];
  }

  /**
   * Get remaining sessions for a student
   * Students get 4 free sessions per month, calculated from their registration date
   */
  async getRemainingStudentSessions(userId: number): Promise<{ 
    remainingSessions: number;
    nextResetDate: string;
    totalSessionsThisPeriod: number;
    isStudent: boolean;
  }> {
    // First check if the user is a student
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is a student by querying the clients table
    const client = await sequelize.query(
      `SELECT "isStudent", "userId" FROM clients WHERE "userId" = ?`,
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    const isStudent = client.length > 0 && (client[0] as any).isStudent === true;
    
    if (!isStudent) {
      return {
        remainingSessions: 0,
        nextResetDate: '',
        totalSessionsThisPeriod: 0,
        isStudent: false
      };
    }

    // Get user's registration date
    const registrationDate = user.createdAt;
    const currentDate = new Date();
    
    // Calculate the current period's start and end dates
    let periodStartDate = new Date(registrationDate);
    periodStartDate.setFullYear(currentDate.getFullYear());
    periodStartDate.setMonth(currentDate.getMonth());

    // If we've passed the day of month from registration, move to next month
    if (currentDate.getDate() > registrationDate.getDate()) {
      periodStartDate.setMonth(periodStartDate.getMonth() + 1);
    }
    
    // Set the day to match registration date
    periodStartDate.setDate(registrationDate.getDate());
    
    // If periodStartDate is in the future, go back one month
    if (periodStartDate > currentDate) {
      periodStartDate.setMonth(periodStartDate.getMonth() - 1);
    }
    
    // Calculate period end date (next reset date)
    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setMonth(periodEndDate.getMonth() + 1);
    
    // Format dates for SQL query
    const formattedStartDate = periodStartDate.toISOString().split('T')[0];
    const formattedEndDate = periodEndDate.toISOString().split('T')[0];
    
    // Count sessions in the current period - ONLY count free sessions (price = 0)
    const sessions = await Session.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [formattedStartDate, formattedEndDate]
        },
        status: {
          [Op.not]: 'cancelled' // Don't count cancelled sessions
        },
        price: 0 // Only count free sessions
      }
    });
    
    const totalSessionsThisPeriod = sessions.length;
    const maxSessionsPerMonth = 4;
    const remainingSessions = Math.max(0, maxSessionsPerMonth - totalSessionsThisPeriod);
    
    return {
      remainingSessions,
      nextResetDate: formattedEndDate,
      totalSessionsThisPeriod,
      isStudent: true
    };
  }
}

export default new SessionService();
