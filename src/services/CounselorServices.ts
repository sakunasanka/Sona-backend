import { ValidationError, ItemNotFoundError, DatabaseError } from '../utils/errors';
import Counselor from '../models/Counselor';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';

export interface CounselorResponse {
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
}

export class CounselorService {
  /**
   * Get all available counselors that are approved
   */
  static async getAllAvailableCounselors(): Promise<CounselorResponse[]> {
    try {
      const counselors = await Counselor.findAllAvailableCounselors();
      return counselors.map(counselor => ({
        id: counselor.id,
        firebaseId: counselor.firebaseId,
        name: counselor.name,
        email: counselor.email,
        avatar: counselor.avatar,
        role: counselor.role,
        title: counselor.title,
        specialities: counselor.specialities,
        address: counselor.address,
        contact_no: counselor.contact_no,
        license_no: counselor.license_no,
        idCard: counselor.idCard,
        isVolunteer: counselor.isVolunteer,
        isAvailable: counselor.isAvailable,
        description: counselor.description,
        rating: counselor.rating,
        sessionFee: counselor.sessionFee,
        status: counselor.status
      }));
    } catch (error) {
      console.error('Error fetching available counselors:', error);
      throw new DatabaseError('Failed to fetch available counselors');
    }
  }

  /**
   * Get counselor by ID
   */
  static async getCounselorById(id: number): Promise<CounselorResponse> {
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new ValidationError('Counselor ID is required and must be a positive number');
    }

    const counselor = await Counselor.findCounselorById(id);
    
    if (!counselor) {
      throw new ItemNotFoundError('Counselor not found with the provided ID');
    }
    
    return {
      id: counselor.id,
      firebaseId: counselor.firebaseId,
      name: counselor.name,
      email: counselor.email,
      avatar: counselor.avatar,
      role: counselor.role,
      title: counselor.title,
      specialities: counselor.specialities,
      address: counselor.address,
      contact_no: counselor.contact_no,
      license_no: counselor.license_no,
      idCard: counselor.idCard,
      isVolunteer: counselor.isVolunteer,
      isAvailable: counselor.isAvailable,
      description: counselor.description,
      rating: counselor.rating,
      sessionFee: counselor.sessionFee,
      status: counselor.status
    };
  }

  /**
   * Update counselor availability status
   */
  static async updateCounselorAvailability(id: number, isAvailable: boolean): Promise<CounselorResponse> {
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new ValidationError('Counselor ID is required and must be a positive number');
    }

    if (typeof isAvailable !== 'boolean') {
      throw new ValidationError('isAvailable must be a boolean value');
    }

    try {
      // First, find the counselor
      const counselor = await Counselor.findCounselorById(id);
      
      if (!counselor) {
        throw new ItemNotFoundError('Counselor not found with the provided ID');
      }

      // Update availability in the database
      await sequelize.query(`
        UPDATE counselors
        SET "isAvailable" = $1, "updatedAt" = NOW()
        WHERE "userId" = $2
      `, {
        bind: [isAvailable, id],
        type: QueryTypes.UPDATE
      });

      // Update the counselor object
      counselor.isAvailable = isAvailable;
      
      return {
        id: counselor.id,
        firebaseId: counselor.firebaseId,
        name: counselor.name,
        email: counselor.email,
        avatar: counselor.avatar,
        role: counselor.role,
        title: counselor.title,
        specialities: counselor.specialities,
        address: counselor.address,
        contact_no: counselor.contact_no,
        license_no: counselor.license_no,
        idCard: counselor.idCard,
        isVolunteer: counselor.isVolunteer,
        isAvailable: isAvailable,
        description: counselor.description,
        rating: counselor.rating,
        sessionFee: counselor.sessionFee,
        status: counselor.status
      };
    } catch (error) {
      if (error instanceof ItemNotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update counselor availability');
    }
  }
} 