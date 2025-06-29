import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Counselor extends Model {
  public userId!: number;
  public title?: string;  // e.g., "Licensed Clinical Psychologist"
  public specialties!: string[];  // e.g., ["Anxiety", "Depression", "Trauma"]
  public address?: string;
  public contact_no?: string;
  public licenseNo?: string; // e.g., "SLCP-12345" (Sri Lanka College of Psychiatrists)
  public idCard?: string;  // path to ID card image or PDF
  public isVolunteer!: boolean;
  public isAvailable!: boolean;
  public description?: string;
  public rating?: number;
  public sessionFee?: number;  // Fee charged per session in LKR
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Counselor.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    licenseNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idCard: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVolunteer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
      defaultValue: 0.0,
      comment: 'Fee charged per session in LKR'
    },
  },
  {
    sequelize,
    modelName: 'counselor',
    tableName: 'counselors',
  }
);

// Set up associations
Counselor.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Counselor, { foreignKey: 'userId' });

export default Counselor;
