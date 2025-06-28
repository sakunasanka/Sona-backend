import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Counselor extends Model {
  public userId!: number;
  public title?: string;  // e.g., "Licensed Clinical Psychologist"
  public specialties!: string[];  // e.g., ["Anxiety", "Depression", "Trauma"]
  public address?: string;
  public contact_no?: string;
  public isVolunteer!: boolean;
  public isAvailable!: boolean;
  public description?: string;
  public rating?: number;
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
