import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class SessionType extends Model {
  public id!: string;  // video, phone, chat
  public name!: string;  // Video Call, Phone Call, Text Chat
  public description!: string;
  public duration!: number;  // in minutes
  public price!: number;  // price in dollars
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SessionType.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,  // Default duration 50 minutes
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'sessionType',
    tableName: 'session_types',
  }
);

export default SessionType;
