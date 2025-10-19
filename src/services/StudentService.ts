import { ValidationError, ItemNotFoundError, DatabaseError } from '../utils/errors';
import Student, { StudentData } from '../models/Student';
import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

export class StudentService {
  /**
   * Apply for student plan
   */
  static async applyForStudentPlan(studentData: Omit<StudentData, 'id' | 'applicationStatus' | 'rejectionReason' | 'createdAt' | 'updatedAt'>): Promise<Student> {
    try {
      // Check if client already has a student application
      const existingApplication = await Student.findByClientId(studentData.clientId);
      if (existingApplication) {
        throw new ValidationError('Client already has a student application');
      }

      // Validate required fields
      if (!studentData.clientId || !studentData.fullName || !studentData.university ||
          !studentData.studentIDCopy || !studentData.uniEmail) {
        throw new ValidationError('All required fields must be provided');
      }

      // Create the student application
      const student = await Student.createStudentApplication({
        ...studentData,
        applicationStatus: 'pending',
        rejectionReason: null,
      });

      return student;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error creating student application:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new DatabaseError('Failed to create student application');
    }
  }

  /**
   * Get student application by client ID
   */
  static async getStudentApplication(clientId: number): Promise<Student | null> {
    try {
      if (!clientId || typeof clientId !== 'number' || clientId <= 0) {
        throw new ValidationError('Valid client ID is required');
      }

      return await Student.findByClientId(clientId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error fetching student application:', error);
      throw new DatabaseError('Failed to fetch student application');
    }
  }

  /**
   * Get student application by ID
   */
  static async getStudentApplicationById(id: number): Promise<Student> {
    try {
      if (!id || typeof id !== 'number' || id <= 0) {
        throw new ValidationError('Valid student application ID is required');
      }

      const student = await Student.findById(id);
      if (!student) {
        throw new ItemNotFoundError('Student application not found');
      }

      return student;
    } catch (error) {
      if (error instanceof ItemNotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error fetching student application:', error);
      throw new DatabaseError('Failed to fetch student application');
    }
  }

  /**
   * Update application status (admin only)
   */
  static async updateApplicationStatus(id: number, status: 'pending' | 'approved' | 'rejected', rejectionReason?: string): Promise<Student> {
    try {
      if (!id || typeof id !== 'number' || id <= 0) {
        throw new ValidationError('Valid student application ID is required');
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        throw new ValidationError('Invalid application status');
      }

      if (status === 'rejected' && !rejectionReason) {
        throw new ValidationError('Rejection reason is required when rejecting an application');
      }

      const student = await Student.updateApplicationStatus(id, status, rejectionReason);
      if (!student) {
        throw new ItemNotFoundError('Student application not found');
      }

      return student;
    } catch (error) {
      if (error instanceof ItemNotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error updating student application status:', error);
      throw new DatabaseError('Failed to update student application status');
    }
  }

  /**
   * Get all student applications (admin only)
   */
  static async getAllStudentApplications(status?: 'pending' | 'approved' | 'rejected'): Promise<Student[]> {
    try {
      return await Student.findAll(status);
    } catch (error) {
      console.error('Error fetching student applications:', error);
      throw new DatabaseError('Failed to fetch student applications');
    }
  }

  /**
   * Check if client is approved student
   */
  static async isApprovedStudent(clientId: number): Promise<boolean> {
    try {
      const student = await Student.findByClientId(clientId);
      return student ? student.applicationStatus === 'approved' : false;
    } catch (error) {
      console.error('Error checking student status:', error);
      return false;
    }
  }
}