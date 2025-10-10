import { DataTypes, QueryTypes } from "sequelize";
import { sequelize } from "../config/db";

export interface StudentData {
  id?: number;
  clientId: number;
  fullName: string;
  university: string;
  studentIDCopy: string;
  uniEmail: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  
}

class Student {
  public id!: number;
  public clientId!: number;
  public fullName!: string;
  public university!: string;
  public studentIDCopy!: string;
  public uniEmail!: string;
  public applicationStatus!: 'pending' | 'approved' | 'rejected';
  public rejectionReason!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Create a new student application
  static async createStudentApplication(studentData: Omit<StudentData, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
    const result = await sequelize.query(`
      INSERT INTO students (
        "clientID",
        "fullName",
        "university",
        "studentIDCopy",
        "uniEmail",
        "applicationStatus",
        "rejectionReason",
        "createdAt",
        "updatedAt"
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      RETURNING *
    `, {
      replacements: [
        studentData.clientId,
        studentData.fullName,
        studentData.university,
        studentData.studentIDCopy,
        studentData.uniEmail,
        studentData.applicationStatus,
        studentData.rejectionReason || null,
      ],
      type: QueryTypes.INSERT
    });

    const data = (result[0] as any)[0];
    return this.mapToStudent(data);
  }

  // Find student application by client ID
  static async findByClientId(clientId: number): Promise<Student | null> {
    const result = await sequelize.query(`
      SELECT * FROM students WHERE "clientID" = ?
    `, {
      replacements: [clientId],
      type: QueryTypes.SELECT
    });

    if (result.length === 0) return null;
    return this.mapToStudent(result[0] as any);
  }

  // Find student application by ID
  static async findById(id: number): Promise<Student | null> {
    const result = await sequelize.query(`
      SELECT * FROM students WHERE id = ?
    `, {
      replacements: [id],
      type: QueryTypes.SELECT
    });

    if (result.length === 0) return null;
    return this.mapToStudent(result[0] as any);
  }

  // Update application status
  static async updateApplicationStatus(id: number, status: 'pending' | 'approved' | 'rejected', rejectionReason?: string): Promise<Student | null> {
    const result = await sequelize.query(`
      UPDATE students
      SET "applicationStatus" = ?, "rejectionReason" = ?, "updatedAt" = NOW()
      WHERE id = ?
      RETURNING *
    `, {
      replacements: [
        status,
        rejectionReason !== undefined ? rejectionReason : null, // Ensure rejectionReason is null if undefined
        id
      ],
      type: QueryTypes.SELECT
    });

    console.log('Replacements:', [
      status,
      rejectionReason !== undefined ? rejectionReason : null, // Ensure rejectionReason is null if undefined
      id
    ]); // Debug log for replacements array

    if (!result || result.length === 0) return null;
    return this.mapToStudent(result[0] as any);
  }

  // Get all student applications with optional status filter
  static async findAll(status?: 'pending' | 'approved' | 'rejected'): Promise<Student[]> {
    let query = `SELECT * FROM students`;
    let replacements: any[] = [];

    if (status) {
      query += ` WHERE "applicationStatus" = ?`;
      replacements.push(status);
    }

    query += ` ORDER BY "createdAt" DESC`;

    const results = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => this.mapToStudent(data));
  }

  // Helper method to map database row to Student instance
  private static mapToStudent(data: any): Student {
    const student = new Student();
    student.id = data.id;
    student.clientId = data.clientID;
    student.fullName = data.fullName;
    student.university = data.university;
    student.studentIDCopy = data.studentIDCopy;
    student.uniEmail = data.uniEmail;
    student.applicationStatus = data.applicationStatus;
    student.rejectionReason = data.rejectionReason;
    student.createdAt = new Date(data.createdAt);
    student.updatedAt = new Date(data.updatedAt);
    return student;
  }
}

export default Student;