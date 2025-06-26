import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class TimeSlot extends Model {
  public id!: number;
  public counselorId!: number;  // Counselor who has this time slot
  public date!: Date;  // Date of the time slot
  public time!: string;  // Time of the slot (e.g. "10:00")
  public isBooked!: boolean;  // Whether the slot is booked
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TimeSlot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    counselorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isBooked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'timeSlot',
    tableName: 'time_slots',
  }
);

export default TimeSlot;
