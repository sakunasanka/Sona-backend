import { DataTypes, Model, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { DatabaseError } from '../utils/errors';

class Counselor extends User {
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

  static async createCounselor( userData : {
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
        role: 'Counselor', 
      }, { transaction });

      console.log('User created with ID:', user.id); // ✅ Debug log

      await sequelize.query(`
        INSERT INTO counselors (
                "userId", 
                title,
                specialities,
                address,
                contact_no,
                "licenseNo",
                "idCard",
                "isVolunteer",
                "isAvailable",
                "description",
                "rating",
                "sessionFee",
                "status",
                "coverImage",
                "instagram",
                "linkedin",
                "x",
                "website",
                "languages",
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
          userData.status || 'pending', // Default status is pending
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

      // Return the client instance with all data
      const counselor = new Counselor();
      counselor.id = user.id;
      counselor.firebaseId = user.firebaseId;
      counselor.name = user.name;
      counselor.email = user.email;
      counselor.avatar = user.avatar;
      counselor.title = userData.title;
      counselor.specialities = userData.specialities;
      counselor.address = userData.address;
      counselor.contact_no = userData.contact_no;
      counselor.license_no = userData.license_no;
      counselor.idCard = userData.idCard;
      counselor.isVolunteer = userData.isVolunteer;
      counselor.isAvailable = userData.isAvailable;
      counselor.description = userData.description;
      counselor.rating = userData.rating;
      counselor.sessionFee = userData.sessionFee;
      counselor.status = userData.status || 'pending';
      counselor.coverImage = userData.coverImage;
      counselor.instagram = userData.instagram;
      counselor.linkedin = userData.linkedin;
      counselor.x = userData.x;
      counselor.website = userData.website;
      counselor.languages = userData.languages;

      return counselor;

    }catch(error){
      await transaction.rollback();
      throw new DatabaseError(`Failed to create counselor,` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Find counselor with joined data
  static async findCounselorById(id: number): Promise<Counselor | null> {
    const result = await sequelize.query(`
      SELECT 
        u.id, u."firebaseId", u.name, u.email, u.avatar, u.role, u."createdAt", u."updatedAt",
        c.title, c.specialities, c.address, c.contact_no, c."licenseNo", c."idCard", 
        c."isVolunteer", c."isAvailable", c.description, c.rating, c."sessionFee", c.status,
        c."coverImage", c.instagram, c.linkedin, c.x, c.website, c.languages
      FROM users u
      JOIN counselors c ON u.id = c."userId"
      WHERE u.id = ? AND u.role = 'Counselor'
    `, {
      replacements: [id],
      type: QueryTypes.SELECT
    });

    if (result.length === 0) return null;

    const data = result[0] as any;
    const counselor = new Counselor();

    // Set all properties
    counselor.id = data.id;
    counselor.firebaseId = data.firebaseId;
    counselor.name = data.name;
    counselor.email = data.email;
    counselor.avatar = data.avatar;
    counselor.title = data.title;
    counselor.specialities = data.specialities;
    counselor.address = data.address;
    counselor.contact_no = data.contact_no;
    counselor.license_no = data.licenseNo;
    counselor.idCard = data.idCard;
    counselor.isVolunteer = data.isVolunteer;
    counselor.isAvailable = data.isAvailable;
    counselor.description = data.description;
    counselor.rating = data.rating;
    counselor.sessionFee = data.sessionFee;
    counselor.status = data.status;
    counselor.coverImage = data.coverImage;
    counselor.instagram = data.instagram;
    counselor.linkedin = data.linkedin;
    counselor.x = data.x;
    counselor.website = data.website;
    counselor.languages = data.languages;

    return counselor;
  }

  // Find all available and approved counselors
  static async findAllAvailableCounselors(): Promise<Counselor[]> {
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
        c."title", 
        c."specialities", 
        c."address", 
        c."contact_no", 
        c."licenseNo", 
        c."idCard",
        c."isVolunteer", 
        c."isAvailable", 
        c."description", 
        c."rating", 
        c."sessionFee",
        c."status",
        c."coverImage", 
        c."instagram", 
        c."linkedin", 
        c."x", 
        c."website",
        c."languages"
      FROM users u
      JOIN counselors c ON u.id = c."userId"
      WHERE u."role" = 'Counselor' AND c."isAvailable" = true AND c."status" = 'approved'
    `, {
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const counselor = new Counselor();
      counselor.id = data.id;
      counselor.firebaseId = data.firebaseId;
      counselor.name = data.name;
      counselor.email = data.email;
      counselor.avatar = data.avatar;
      counselor.role = data.role;
      counselor.title = data.title;
      counselor.specialities = data.specialities;
      counselor.address = data.address;
      counselor.contact_no = data.contact_no;
      counselor.license_no = data.licenseNo;
      counselor.idCard = data.idCard;
      counselor.isVolunteer = data.isVolunteer;
      counselor.isAvailable = data.isAvailable;
      counselor.description = data.description;
      counselor.rating = data.rating;
      counselor.sessionFee = data.sessionFee;
      counselor.status = data.status;
      counselor.coverImage = data.coverImage;
      counselor.instagram = data.instagram;
      counselor.linkedin = data.linkedin;
      counselor.x = data.x;
      counselor.website = data.website;
      counselor.languages = data.languages;
      return counselor;
    });
  }

  // Find all counselors (for admin)
  static async findAllCounselors(): Promise<Counselor[]> {
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
        c."title", 
        c."specialities", 
        c."address", 
        c."contact_no", 
        c."licenseNo", 
        c."idCard",
        c."isVolunteer", 
        c."isAvailable", 
        c."description", 
        c."rating", 
        c."sessionFee",
        c."status",
        c."coverImage", 
        c."instagram", 
        c."linkedin", 
        c."x", 
        c."website",
        c."languages"
      FROM users u
      JOIN counselors c ON u.id = c."userId"
      WHERE u."role" = 'Counselor'
    `, {
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const counselor = new Counselor();
      counselor.id = data.id;
      counselor.firebaseId = data.firebaseId;
      counselor.name = data.name;
      counselor.email = data.email;
      counselor.avatar = data.avatar;
      counselor.role = data.role;
      counselor.title = data.title;
      counselor.specialities = data.specialities;
      counselor.address = data.address;
      counselor.contact_no = data.contact_no;
      counselor.license_no = data.licenseNo;
      counselor.idCard = data.idCard;
      counselor.isVolunteer = data.isVolunteer;
      counselor.isAvailable = data.isAvailable;
      counselor.description = data.description;
      counselor.rating = data.rating;
      counselor.sessionFee = data.sessionFee;
      counselor.status = data.status;
      counselor.coverImage = data.coverImage;
      counselor.instagram = data.instagram;
      counselor.linkedin = data.linkedin;
      counselor.x = data.x;
      counselor.website = data.website;
      counselor.languages = data.languages;
      return counselor;
    });
  }

  // Update counselor status
  static async updateCounselorStatus(id: number, status: string): Promise<Counselor | null> {
    try {
      await sequelize.query(`
        UPDATE counselors
        SET status = $1, "updatedAt" = NOW()
        WHERE "userId" = $2
      `, {
        bind: [status, id],
        type: QueryTypes.UPDATE
      });

      return this.findCounselorById(id);
    } catch (error) {
      throw new DatabaseError(`Failed to update counselor status: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

export default Counselor;
