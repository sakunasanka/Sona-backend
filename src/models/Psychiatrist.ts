import { DataTypes, Model, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { DatabaseError } from '../utils/errors'; // Make sure you have this utility

class Psychiatrist extends Model {
  public userId!: number;
  //public title!: string;
  public specialization!: string[];
  public address!: string;
  public contact_no!: string;
  public licenseNo!: string;
  public idCard!: string;
  //public isVolunteer?: boolean;
  public isAvailable?: boolean;
  public description?: string;
  //public rating?: number;
  //public sessionFee?: number;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Unset';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Psychiatrist.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    // title: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    // },
    specialization: {
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
    // isVolunteer: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: true,
    // },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // rating: {
    //   type: DataTypes.FLOAT,
    //   allowNull: true,
    // },
    // sessionFee: {
    //   type: DataTypes.FLOAT,
    //   allowNull: true,
    // },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Unset'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  {
    sequelize,
    modelName: 'psychiatrist',
    tableName: 'psychiatrists',
  }
);

Psychiatrist.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Psychiatrist;
