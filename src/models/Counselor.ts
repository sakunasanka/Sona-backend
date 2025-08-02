import { DataTypes, Model, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { DatabaseError } from '../utils/errors'; // Make sure you have this utility

class Counselor extends Model {

  public userId!: number;
  public title!: string;
  public specialities!: string[];
  public address!: string;
  public contact_no!: string;
  public licenseNo!: string;
  public idCard!: string;
  public isVolunteer?: boolean;
  public isAvailable?: boolean;
  public description?: string;
  public rating?: number;
  public sessionFee?: number;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Unset';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static async createCounselor(userData: {
    firebaseId: string;
    name: string;
    email: string;
    avatar?: string;
    title: string;
    specialities: string[];
    address: string;
    contact_no: string;
    licenseNo: string;
    idCard: string;
    isVolunteer?: boolean;
    isAvailable?: boolean;
    description?: string;
    rating?: number;
    sessionFee?: number;
  }) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.create(
        {
          firebaseId: userData.firebaseId,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar || null,
          role: 'Counsellor',
        },
        { transaction }
      );

      await sequelize.query(
        `
        INSERT INTO counselors (
          "userId",
          title,
          specialities,
          address,
          contact_no,
          licenseNo,
          "idCard",
          "isVolunteer",
          "isAvailable",
          description,
          rating,
          "sessionFee",
          status,
          "createdAt",
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      `,
        {
          bind: [
            user.id,
            userData.title,
            userData.specialities,
            userData.address,
            userData.contact_no,
            userData.licenseNo,
            userData.idCard,
            userData.isVolunteer ?? false,
            userData.isAvailable ?? true,
            userData.description,
            userData.rating,
            userData.sessionFee,
            'Pending', // default status
          ],
          transaction,
        }
      );

      await transaction.commit();

      const counselor = new Counselor();
      counselor.userId = user.id;
      counselor.title = userData.title;
      counselor.specialities = userData.specialities;
      counselor.address = userData.address;
      counselor.contact_no = userData.contact_no;
      counselor.licenseNo = userData.licenseNo;
      counselor.idCard = userData.idCard;
      counselor.isVolunteer = userData.isVolunteer;
      counselor.isAvailable = userData.isAvailable;
      counselor.description = userData.description;
      counselor.rating = userData.rating;
      counselor.sessionFee = userData.sessionFee;
      counselor.status = 'Pending';
      return counselor;
    } catch (error) {
      await transaction.rollback();
      throw new DatabaseError(
        `Failed to create counselor: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async findCounselorById(id: number): Promise<Counselor | null> {
    const result = await sequelize.query(
      `
      SELECT 
        u.id, u.firebaseId, u.name, u.email, u.avatar, u.role, u.createdAt, u.updatedAt,
        c.userId, c.title, c.specialities, c.address, c.contact_no, c.licenseNo,
        c."idCard", c."isVolunteer", c."isAvailable", c.description, c.rating, c."sessionFee", c.status
      FROM users u
      JOIN counselors c ON u.id = c.userId
      WHERE u.id = ? AND u.role = 'Counsellor'
    `,
      {
        replacements: [id],
        type: QueryTypes.SELECT,
      }
    );

    if (result.length === 0) return null;

    const data = result[0] as any;
    const counselor = new Counselor();


    counselor.userId = data.userId;
    counselor.title = data.title;
    counselor.specialities = data.specialities;
    counselor.address = data.address;
    counselor.contact_no = data.contact_no;
    counselor.licenseNo = data.license_no;
    counselor.idCard = data.idCard;
    counselor.isVolunteer = data.isVolunteer;
    counselor.isAvailable = data.isAvailable;
    counselor.description = data.description;
    counselor.rating = data.rating;
    counselor.sessionFee = data.sessionFee;
    counselor.status = data.status;

    return counselor;
  }
}

Counselor.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // ✅ THIS IS MISSING
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    licenseNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    idCard: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isVolunteer: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    sessionFee: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Unset'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  {
    sequelize,
    modelName: 'counselor',
    tableName: 'counselors',
  }
);

Counselor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Counselor;