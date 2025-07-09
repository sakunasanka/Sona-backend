import { DataTypes, Model, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

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
  }) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.create({
        firebaseId: userData.firebaseId,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        userType: 'Client',
      }, {transaction});

      await sequelize.query(`
        INSERT INTO counselors (
                id, 
                title,
                specialities,
                address,
                contact_no,
                license_no,
                idCard,
                isVolunteer,
                isAvailable,
                description,
                rating,
                sessionFee,
                createdAt, 
                updatedAt
            )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
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

      return counselor;

    }catch(error){
      await transaction.rollback();
      throw error;
    }
  }

  // Find counselor with joined data
  static async findCounselorById(id: number): Promise<Counselor | null> {
    const result = await sequelize.query(`
      SELECT 
        u.id, u.firebaseId, u.name, u.email, u.avatar, u.userType, u.createdAt, u.updatedAt,
        c.title, c.specialities, c.address, c.contact_no, c.license_no, c.idCard, c.isVolunteer, c.isAvailable, c.description, c.rating, c.sessionFee
      FROM users u
      JOIN counselors c ON u.id = c.id
      WHERE u.id = ? AND u.userType = 'Counselor'
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
    counselor.license_no = data.license_no;
    counselor.idCard = data.idCard;
    counselor.isVolunteer = data.isVolunteer;
    counselor.isAvailable = data.isAvailable;
    counselor.description = data.description;
    counselor.rating = data.rating;
    counselor.sessionFee = data.sessionFee;

    return counselor;
  }
}



export default Counselor;
