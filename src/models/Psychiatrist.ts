import { DataTypes, Model, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { DatabaseError } from '../utils/errors';

class Psychiatrist extends User {
  public title!: string;
  public specialities!: string[];
  public address!: string;
  public contact_no!: string;
  public license_no!: string;
  public idCard!: string;
  public isVolunteer?: boolean;
  public isAvailable?: boolean;
  public description?: string;
  public rating?: number;
  public sessionFee?: number;
  public status?: string;
  public coverImage?: string;
  public instagram?: string;
  public linkedin?: string;
  public x?: string;
  public website?: string;
  public languages?: string[];

  static async createPsychiatrist(userData: {
    firebaseId: string;
    name: string;
    email: string;
    avatar?: string;
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
    coverImage?: string;
    instagram?: string;
    linkedin?: string;
    x?: string;
    website?: string;
    languages?: string[];
  }) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.create({
        firebaseId: userData.firebaseId,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || null,
        role: 'Psychiatrist', 
      }, { transaction });

      console.log('User created with ID:', user.id);

      await sequelize.query(`
        INSERT INTO psychiatrists (
                "userId", 
                title,
                specialities,
                address,
                contact_no,
                "licenseNo",
                "idCard",
                "isVolunteer",
                "isAvailable",
                description,
                rating,
                "sessionFee",
                status,
                "coverImage",
                instagram,
                linkedin,
                x,
                website,
                languages,
                "createdAt",
                "updatedAt"
            )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
      `, {
        bind: [
          user.id,
          userData.title,
          userData.specialities,
          userData.address,
          userData.contact_no,
          userData.license_no,
          userData.idCard,
          userData.isVolunteer,
          userData.isAvailable,
          userData.description,
          userData.rating,
          userData.sessionFee,
          userData.status || 'pending', // Default status is pending (matching counselor)
          userData.coverImage,
          userData.instagram,
          userData.linkedin,
          userData.x,
          userData.website,
          userData.languages,
        ],
        transaction
      });

      await transaction.commit();

      // Return the psychiatrist instance with all data
      const psychiatrist = new Psychiatrist();
      psychiatrist.id = user.id;
      psychiatrist.firebaseId = user.firebaseId;
      psychiatrist.name = user.name;
      psychiatrist.email = user.email;
      psychiatrist.avatar = user.avatar;
      psychiatrist.title = userData.title;
      psychiatrist.specialities = userData.specialities;
      psychiatrist.address = userData.address;
      psychiatrist.contact_no = userData.contact_no;
      psychiatrist.license_no = userData.license_no;
      psychiatrist.idCard = userData.idCard;
      psychiatrist.isVolunteer = userData.isVolunteer;
      psychiatrist.isAvailable = userData.isAvailable;
      psychiatrist.description = userData.description;
      psychiatrist.rating = userData.rating;
      psychiatrist.sessionFee = userData.sessionFee;
      psychiatrist.status = userData.status || 'pending';
      psychiatrist.coverImage = userData.coverImage;
      psychiatrist.instagram = userData.instagram;
      psychiatrist.linkedin = userData.linkedin;
      psychiatrist.x = userData.x;
      psychiatrist.website = userData.website;
      psychiatrist.languages = userData.languages;

      return psychiatrist;

    } catch (error) {
      await transaction.rollback();
      throw new DatabaseError(`Failed to create psychiatrist: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Find psychiatrist with joined data
  static async findPsychiatristById(id: number): Promise<Psychiatrist | null> {
    const result = await sequelize.query(`
      SELECT 
        u.id, u."firebaseId", u.name, u.email, u.avatar, u.role, u."createdAt", u."updatedAt",
        p.title, p.specialities, p.address, p.contact_no, p."licenseNo", p."idCard", 
        p."isVolunteer", p."isAvailable", p.description, p.rating, p."sessionFee", p.status,
        p."coverImage", p.instagram, p.linkedin, p.x, p.website, p.languages
      FROM users u
      JOIN psychiatrists p ON u.id = p."userId"
      WHERE u.id = ? AND u.role = 'Psychiatrist'
    `, {
      replacements: [id],
      type: QueryTypes.SELECT
    });

    if (result.length === 0) return null;

    const data = result[0] as any;
    const psychiatrist = new Psychiatrist();

    // Set all properties
    psychiatrist.id = data.id;
    psychiatrist.firebaseId = data.firebaseId;
    psychiatrist.name = data.name;
    psychiatrist.email = data.email;
    psychiatrist.avatar = data.avatar;
    psychiatrist.title = data.title;
    psychiatrist.specialities = data.specialities;
    psychiatrist.address = data.address;
    psychiatrist.contact_no = data.contact_no;
    psychiatrist.license_no = data.licenseNo;
    psychiatrist.idCard = data.idCard;
    psychiatrist.isVolunteer = data.isVolunteer;
    psychiatrist.isAvailable = data.isAvailable;
    psychiatrist.description = data.description;
    psychiatrist.rating = data.rating;
    psychiatrist.sessionFee = data.sessionFee;
    psychiatrist.status = data.status;
    psychiatrist.coverImage = data.coverImage;
    psychiatrist.instagram = data.instagram;
    psychiatrist.linkedin = data.linkedin;
    psychiatrist.x = data.x;
    psychiatrist.website = data.website;
    psychiatrist.languages = data.languages;

    return psychiatrist;
  }

  // Find all available psychiatrists
  static async findAllAvailablePsychiatrists(): Promise<Psychiatrist[]> {
    const results = await sequelize.query(`
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", 
        u."email", 
        u."avatar", 
        u."role", 
        u."createdAt", 
        u."updatedAt",
        p."title", 
        p."specialities", 
        p."address", 
        p."contact_no", 
        p."licenseNo", 
        p."idCard",
        p."isVolunteer", 
        p."isAvailable", 
        p."description", 
        p."rating", 
        p."sessionFee",
        p."status",
        p."coverImage", 
        p."instagram", 
        p."linkedin", 
        p."x", 
        p."website",
        p."languages"
      FROM users u
      JOIN psychiatrists p ON u.id = p."userId"
      WHERE u."role" = 'Psychiatrist' AND p."isAvailable" = true AND p."status" = 'approved'
      ORDER BY p."rating" DESC, u."name" ASC
    `, {
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const psychiatrist = new Psychiatrist();
      psychiatrist.id = data.id;
      psychiatrist.firebaseId = data.firebaseId;
      psychiatrist.name = data.name;
      psychiatrist.email = data.email;
      psychiatrist.avatar = data.avatar;
      psychiatrist.role = data.role;
      psychiatrist.title = data.title;
      psychiatrist.specialities = data.specialities;
      psychiatrist.address = data.address;
      psychiatrist.contact_no = data.contact_no;
      psychiatrist.license_no = data.licenseNo;
      psychiatrist.idCard = data.idCard;
      psychiatrist.isVolunteer = data.isVolunteer;
      psychiatrist.isAvailable = data.isAvailable;
      psychiatrist.description = data.description;
      psychiatrist.rating = data.rating;
      psychiatrist.sessionFee = data.sessionFee;
      psychiatrist.status = data.status;
      psychiatrist.coverImage = data.coverImage;
      psychiatrist.instagram = data.instagram;
      psychiatrist.linkedin = data.linkedin;
      psychiatrist.x = data.x;
      psychiatrist.website = data.website;
      psychiatrist.languages = data.languages;
      return psychiatrist;
    });
  }

  // Find all psychiatrists (for admin)
  static async findAllPsychiatrists(): Promise<Psychiatrist[]> {
    const results = await sequelize.query(`
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", 
        u."email", 
        u."avatar", 
        u."role", 
        u."createdAt", 
        u."updatedAt",
        p."title", 
        p."specialities", 
        p."address", 
        p."contact_no", 
        p."licenseNo", 
        p."idCard",
        p."isVolunteer", 
        p."isAvailable", 
        p."description", 
        p."rating", 
        p."sessionFee",
        p."status",
        p."coverImage", 
        p."instagram", 
        p."linkedin", 
        p."x", 
        p."website",
        p."languages"
      FROM users u
      JOIN psychiatrists p ON u.id = p."userId"
      WHERE u."role" = 'Psychiatrist'
      ORDER BY u."name" ASC
    `, {
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const psychiatrist = new Psychiatrist();
      psychiatrist.id = data.id;
      psychiatrist.firebaseId = data.firebaseId;
      psychiatrist.name = data.name;
      psychiatrist.email = data.email;
      psychiatrist.avatar = data.avatar;
      psychiatrist.role = data.role;
      psychiatrist.title = data.title;
      psychiatrist.specialities = data.specialities;
      psychiatrist.address = data.address;
      psychiatrist.contact_no = data.contact_no;
      psychiatrist.license_no = data.licenseNo;
      psychiatrist.idCard = data.idCard;
      psychiatrist.isVolunteer = data.isVolunteer;
      psychiatrist.isAvailable = data.isAvailable;
      psychiatrist.description = data.description;
      psychiatrist.rating = data.rating;
      psychiatrist.sessionFee = data.sessionFee;
      psychiatrist.status = data.status;
      psychiatrist.coverImage = data.coverImage;
      psychiatrist.instagram = data.instagram;
      psychiatrist.linkedin = data.linkedin;
      psychiatrist.x = data.x;
      psychiatrist.website = data.website;
      psychiatrist.languages = data.languages;
      return psychiatrist;
    });
  }

  // Update psychiatrist status
  static async updatePsychiatristStatus(id: number, status: string): Promise<Psychiatrist | null> {
    try {
      await sequelize.query(`
        UPDATE psychiatrists
        SET status = $1, "updatedAt" = NOW()
        WHERE "userId" = $2
      `, {
        bind: [status, id],
        type: QueryTypes.UPDATE
      });

      return this.findPsychiatristById(id);
    } catch (error) {
      throw new DatabaseError(`Failed to update psychiatrist status: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Update psychiatrist availability
  static async updatePsychiatristAvailability(id: number, isAvailable: boolean): Promise<Psychiatrist | null> {
    try {
      await sequelize.query(`
        UPDATE psychiatrists
        SET "isAvailable" = $1, "updatedAt" = NOW()
        WHERE "userId" = $2
      `, {
        bind: [isAvailable, id],
        type: QueryTypes.UPDATE
      });

      return this.findPsychiatristById(id);
    } catch (error) {
      throw new DatabaseError(`Failed to update psychiatrist availability: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

export default Psychiatrist;
