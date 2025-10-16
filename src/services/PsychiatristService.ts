import { ValidationError, ItemNotFoundError, DatabaseError } from '../utils/errors';
import Psychiatrist from '../models/Psychiatrist';
import TimeSlot from '../models/TimeSlot';
import PsychiatristTimeSlot from '../models/PsychiatristTimeSlot';
import PsychiatristSession from '../models/PsychiatristSession';
import Session from '../models/Session';
import User from '../models/User';
import { sequelize } from '../config/db';
import { QueryTypes, Op } from 'sequelize';

export interface PsychiatristResponse {
  id: number;
  firebaseId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  title: string;
  specialities: string[];
  address: string;
  contact_no: string;
  license_no: string;
  idCard: string;
  isVolunteer?: boolean;
  isAvailable?: boolean;
  description?: string;
  rating?: number;
  sessionFee?: number;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  coverImage?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
  website?: string;
  languages?: string[];
}

export interface TimeSlotResponse {
  id: string;
  date: string;
  time: string;
  isAvailable: boolean;
  isBooked: boolean;
}

export interface BookingRequest {
  psychiatristId: number;
  date: string;
  timeSlot: string;
  duration: number;
  price: number;
  concerns?: string;
}

export interface BookingResponse {
  bookingId: string;
  sessionId: string;
  psychiatristId: string;
  patientId: string;
  date: string;
  timeSlot: string;
  duration: number;
  price: number;
  status: string;
  concerns?: string;
  createdAt: Date;
}

export class PsychiatristService {
  
  /**
   * Get all available psychiatrists
   */
  static async getAllAvailablePsychiatrists(): Promise<{
    psychiatrists: PsychiatristResponse[];
    count: number;
  }> {
    try {
      const psychiatrists = await Psychiatrist.findAllAvailablePsychiatrists();
      
      const psychiatristResponses: PsychiatristResponse[] = psychiatrists.map(p => ({
        id: p.id,
        firebaseId: p.firebaseId,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        role: p.role,
        title: p.title,
        specialities: p.specialities,
        address: p.address,
        contact_no: p.contact_no,
        license_no: p.license_no,
        idCard: p.idCard,
        isVolunteer: p.isVolunteer,
        isAvailable: p.isAvailable,
        description: p.description,
        rating: p.rating,
        sessionFee: p.sessionFee,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        coverImage: p.coverImage,
        instagram: p.instagram,
        linkedin: p.linkedin,
        x: p.x,
        website: p.website,
        languages: p.languages
      }));

      return {
        psychiatrists: psychiatristResponses,
        count: psychiatrists.length
      };
    } catch (error) {
      throw new DatabaseError(`Failed to fetch psychiatrists: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get psychiatrist by ID
   */
  static async getPsychiatristById(id: number): Promise<PsychiatristResponse> {
    try {
      const psychiatrist = await Psychiatrist.findPsychiatristById(id);
      
      if (!psychiatrist) {
        throw new ItemNotFoundError('Psychiatrist not found');
      }

      return {
        id: psychiatrist.id,
        firebaseId: psychiatrist.firebaseId,
        name: psychiatrist.name,
        email: psychiatrist.email,
        avatar: psychiatrist.avatar,
        role: psychiatrist.role,
        title: psychiatrist.title,
        specialities: psychiatrist.specialities,
        address: psychiatrist.address,
        contact_no: psychiatrist.contact_no,
        license_no: psychiatrist.license_no,
        idCard: psychiatrist.idCard,
        isVolunteer: psychiatrist.isVolunteer,
        isAvailable: psychiatrist.isAvailable,
        description: psychiatrist.description,
        rating: psychiatrist.rating,
        sessionFee: psychiatrist.sessionFee,
        status: psychiatrist.status,
        createdAt: psychiatrist.createdAt,
        updatedAt: psychiatrist.updatedAt,
        coverImage: psychiatrist.coverImage,
        instagram: psychiatrist.instagram,
        linkedin: psychiatrist.linkedin,
        x: psychiatrist.x,
        website: psychiatrist.website,
        languages: psychiatrist.languages
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch psychiatrist: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get monthly availability overview
   */
  static async getMonthlyAvailability(
    psychiatristId: number,
    year: number,
    month: number
  ): Promise<Record<string, any>> {
    try {
      // Check if psychiatrist exists
      const psychiatrist = await Psychiatrist.findPsychiatristById(psychiatristId);
      if (!psychiatrist) {
        throw new ItemNotFoundError('Psychiatrist not found');
      }

      return await PsychiatristTimeSlot.getMonthlyAvailability(psychiatristId, year, month);
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch monthly availability: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get specific date availability
   */
  static async getDateAvailability(
    psychiatristId: number,
    date: string
  ): Promise<{
    availability: TimeSlotResponse[];
    date: string;
  }> {
    try {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
      }

      // Check if psychiatrist exists
      const psychiatrist = await Psychiatrist.findPsychiatristById(psychiatristId);
      if (!psychiatrist) {
        throw new ItemNotFoundError('Psychiatrist not found');
      }

      const slots = await TimeSlot.findAll({
        where: {
          counselorId: psychiatristId,
          date: date,
          isAvailable: true,
          isBooked: false
        },
        order: [['time', 'ASC']]
      });
      
      const availability: TimeSlotResponse[] = slots.map(slot => ({
        id: `slot_${slot.id}`,
        date: slot.date.toString(),
        time: slot.time,
        isAvailable: slot.isAvailable,
        isBooked: slot.isBooked
      }));

      return {
        availability,
        date
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch date availability: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Book a psychiatrist session
   */
  static async bookPsychiatristSession(
    userId: number,
    bookingData: BookingRequest
  ): Promise<BookingResponse> {
    try {
      // Validate required fields
      if (!bookingData.psychiatristId || !bookingData.date || !bookingData.timeSlot) {
        throw new ValidationError('Psychiatrist ID, date, and time slot are required');
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingData.date)) {
        throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
      }

      // Check if psychiatrist exists and is available
      const psychiatrist = await Psychiatrist.findPsychiatristById(bookingData.psychiatristId);
      if (!psychiatrist) {
        throw new ItemNotFoundError('Psychiatrist not found');
      }

      if (!psychiatrist.isAvailable) {
        throw new ValidationError('Psychiatrist is not available for bookings');
      }

      // Find the specific time slot
      const availableSlots = await TimeSlot.findAll({
        where: {
          counselorId: bookingData.psychiatristId,
          date: bookingData.date,
          time: bookingData.timeSlot,
          isAvailable: true,
          isBooked: false
        }
      });

      if (availableSlots.length === 0) {
        throw new ValidationError('Selected time slot is not available');
      }

      const selectedSlot = availableSlots[0];

      // Check for student pricing (if user is a student, apply discount)
      let finalPrice = bookingData.price;
      const user = await User.findByPk(userId);
      
      // Apply student discount if applicable (you can customize this logic)
      if (user && user.role === 'Client') {
        // You might want to check if they're a student in the Client table
        // For now, applying a 20% discount for demonstration
        finalPrice = bookingData.price * 0.8;
      }

      // Book the time slot first
      selectedSlot.isBooked = true;
      await selectedSlot.save();

      // Create the session using the unified Session model
      const session = await Session.create({
        userId,
        counselorId: bookingData.psychiatristId, // Use counselorId field for both counselors and psychiatrists
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        duration: bookingData.duration,
        price: finalPrice,
        notes: bookingData.concerns,
        status: 'confirmed'
      });

      return {
        bookingId: `booking_${session.id}`,
        sessionId: `session_${session.id}`,
        psychiatristId: bookingData.psychiatristId.toString(),
        patientId: session.userId.toString(),
        date: session.date.toString(),
        timeSlot: session.timeSlot,
        duration: session.duration,
        price: session.price,
        status: session.status,
        concerns: session.notes,
        createdAt: session.createdAt
      };

    } catch (error) {
      if (error instanceof ValidationError || error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to book session: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get user's psychiatrist sessions
   */
  static async getUserSessions(userId: number): Promise<any[]> {
    try {
      const sessions = await Session.findAll({
        where: { userId },
        include: [
          {
            model: User,
            as: 'counselor',
            attributes: ['id', 'name', 'avatar', 'role']
          }
        ],
        order: [['date', 'DESC'], ['timeSlot', 'DESC']]
      });
      
      return sessions.map(session => ({
        id: session.id,
        counselorId: session.counselorId,
        counselorName: (session as any).counselor?.name,
        counselorTitle: (session as any).counselor?.role === 'Psychiatrist' ? 'Psychiatrist' : 'Counselor',
        date: session.date,
        timeSlot: session.timeSlot,
        duration: session.duration,
        price: session.price,
        concerns: session.notes,
        status: session.status,
        createdAt: session.createdAt
      }));
    } catch (error) {
      throw new DatabaseError(`Failed to fetch user sessions: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get psychiatrist's sessions
   */
  static async getPsychiatristSessions(psychiatristId: number): Promise<any[]> {
    try {
      const sessions = await Session.findAll({
        where: { counselorId: psychiatristId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar', 'role']
          }
        ],
        order: [['date', 'DESC'], ['timeSlot', 'DESC']]
      });

      // Get userIds from sessions
      const userIds = sessions.map((s: any) => s.userId);

      // Query isStudent status for all users in clients table
      let clientRows: any[] = [];
      if (userIds.length > 0) {
        clientRows = await sequelize.query(
          `SELECT "userId", "isStudent" FROM clients WHERE "userId" IN (:userIds)`,
          {
            replacements: { userIds },
            type: QueryTypes.SELECT
          }
        );
      }

      // Map userId to isStudent
      const isStudentMap = new Map<number, boolean>();
      for (const row of clientRows as any[]) {
        isStudentMap.set(row.userId, row.isStudent === true);
      }

      return sessions.map((session: any) => ({
        id: session.id,
        userId: session.userId,
        counselorId: session.counselorId,
        timeSlotId: null, // Not used in unified model
        date: session.date,
        timeSlot: session.timeSlot,
        duration: session.duration,
        price: session.price,
        concerns: session.notes,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        user: {
          id: session.userId,
          name: session.user?.name,
          email: session.user?.email || '',
          role: session.user?.role || 'Client'
        },
        isStudent: isStudentMap.get(session.userId) || false
      }));
    } catch (error) {
      throw new DatabaseError(`Failed to fetch psychiatrist sessions: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Cancel a session
   */
  static async cancelSession(sessionId: number, cancelledBy: 'user' | 'psychiatrist'): Promise<any> {
    try {
      const session = await Session.findByPk(sessionId);
      
      if (!session) {
        throw new ItemNotFoundError('Session not found');
      }

      // Update session status
      session.status = 'cancelled';
      await session.save();

      return {
        id: session.id,
        status: session.status,
        updatedAt: session.updatedAt
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to cancel session: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Set psychiatrist availability for a specific date
   */
  static async setPsychiatristAvailability(
    psychiatristId: number,
    date: string,
    isAvailable: boolean
  ): Promise<void> {
    try {
      // Check if psychiatrist exists
      const psychiatrist = await Psychiatrist.findPsychiatristById(psychiatristId);
      if (!psychiatrist) {
        throw new ItemNotFoundError('Psychiatrist not found');
      }

      await TimeSlot.update(
        { isAvailable },
        {
          where: {
            counselorId: psychiatristId,
            date: date
          }
        }
      );
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to set availability: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get upcoming sessions count for user
   */
  static async getUpcomingSessionsCount(userId: number): Promise<number> {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      const count = await Session.count({
        where: {
          userId,
          date: {
            [Op.gte]: currentDate
          },
          status: ['scheduled', 'confirmed']
        }
      });

      return count;
    } catch (error) {
      throw new DatabaseError(`Failed to get upcoming sessions count: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get all psychiatrists (for admin)
   */
  static async getAllPsychiatrists(): Promise<{
    psychiatrists: PsychiatristResponse[];
    count: number;
  }> {
    try {
      const psychiatrists = await Psychiatrist.findAllPsychiatrists();
      
      const psychiatristResponses: PsychiatristResponse[] = psychiatrists.map(p => ({
        id: p.id,
        firebaseId: p.firebaseId,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        role: p.role,
        title: p.title,
        specialities: p.specialities,
        address: p.address,
        contact_no: p.contact_no,
        license_no: p.license_no,
        idCard: p.idCard,
        isVolunteer: p.isVolunteer,
        isAvailable: p.isAvailable,
        description: p.description,
        rating: p.rating,
        sessionFee: p.sessionFee,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        coverImage: p.coverImage,
        instagram: p.instagram,
        linkedin: p.linkedin,
        x: p.x,
        website: p.website,
        languages: p.languages
      }));

      return {
        psychiatrists: psychiatristResponses,
        count: psychiatrists.length
      };
    } catch (error) {
      throw new DatabaseError(`Failed to fetch all psychiatrists: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Update psychiatrist availability status
   */
  static async updatePsychiatristAvailability(id: number, isAvailable: boolean): Promise<PsychiatristResponse> {
    try {
      const psychiatrist = await Psychiatrist.updatePsychiatristAvailability(id, isAvailable);
      
      if (!psychiatrist) {
        throw new ItemNotFoundError('Psychiatrist not found');
      }

      return {
        id: psychiatrist.id,
        firebaseId: psychiatrist.firebaseId,
        name: psychiatrist.name,
        email: psychiatrist.email,
        avatar: psychiatrist.avatar,
        role: psychiatrist.role,
        title: psychiatrist.title,
        specialities: psychiatrist.specialities,
        address: psychiatrist.address,
        contact_no: psychiatrist.contact_no,
        license_no: psychiatrist.license_no,
        idCard: psychiatrist.idCard,
        isVolunteer: psychiatrist.isVolunteer,
        isAvailable: psychiatrist.isAvailable,
        description: psychiatrist.description,
        rating: psychiatrist.rating,
        sessionFee: psychiatrist.sessionFee,
        status: psychiatrist.status,
        createdAt: psychiatrist.createdAt,
        updatedAt: psychiatrist.updatedAt,
        coverImage: psychiatrist.coverImage,
        instagram: psychiatrist.instagram,
        linkedin: psychiatrist.linkedin,
        x: psychiatrist.x,
        website: psychiatrist.website,
        languages: psychiatrist.languages
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update psychiatrist availability: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Update psychiatrist status (approve/reject)
   */
  static async updatePsychiatristStatus(id: number, status: string): Promise<PsychiatristResponse> {
    try {
      const psychiatrist = await Psychiatrist.updatePsychiatristStatus(id, status);
      
      if (!psychiatrist) {
        throw new ItemNotFoundError('Psychiatrist not found');
      }

      return {
        id: psychiatrist.id,
        firebaseId: psychiatrist.firebaseId,
        name: psychiatrist.name,
        email: psychiatrist.email,
        avatar: psychiatrist.avatar,
        role: psychiatrist.role,
        title: psychiatrist.title,
        specialities: psychiatrist.specialities,
        address: psychiatrist.address,
        contact_no: psychiatrist.contact_no,
        license_no: psychiatrist.license_no,
        idCard: psychiatrist.idCard,
        isVolunteer: psychiatrist.isVolunteer,
        isAvailable: psychiatrist.isAvailable,
        description: psychiatrist.description,
        rating: psychiatrist.rating,
        sessionFee: psychiatrist.sessionFee,
        status: psychiatrist.status,
        createdAt: psychiatrist.createdAt,
        updatedAt: psychiatrist.updatedAt,
        coverImage: psychiatrist.coverImage,
        instagram: psychiatrist.instagram,
        linkedin: psychiatrist.linkedin,
        x: psychiatrist.x,
        website: psychiatrist.website,
        languages: psychiatrist.languages
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update psychiatrist status: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}
