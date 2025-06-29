import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Session extends Model {
  public id!: number;
  public userId!: number;  // User who booked the session
  public counselorId!: number;  // Professional conducting the session (can be Counselor, Psychiatrist, or MT-member)
  public sessionType!: 'video' | 'phone' | 'chat';
  public date!: Date;  // Date of the session
  public timeSlot!: string;  // Time slot (e.g. "10:00")
  public duration!: number;  // Duration in minutes
  public price!: number;  // Price of the session
  public notes?: string;  // Any concerns or notes from the counselor
  public status!: 'scheduled' | 'completed' | 'cancelled';
  public paymentMethodId?: string;  // ID of the payment method used
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Session.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    counselorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      comment: 'ID of the professional (Counselor, Psychiatrist, or MT-member) conducting the session',
    },
    sessionType: {
      type: DataTypes.ENUM('video', 'phone', 'chat'),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    timeSlot: {
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
    },
    paymentMethodId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'session',
    tableName: 'sessions',
  }
);

// Set up associations
Session.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Session.belongsTo(User, { as: 'counselor', foreignKey: 'counselorId' });
User.hasMany(Session, { as: 'userSessions', foreignKey: 'userId' });
User.hasMany(Session, { as: 'counselorSessions', foreignKey: 'counselorId' });

export default Session;
