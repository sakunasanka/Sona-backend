import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public avatar?: string;
  public role!: 'Client' | 'Counsellor' | 'Psychiatrist' | 'Admin' | 'MT-member';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('Client', 'Counsellor', 'Psychiatrist', 'Admin', 'MT-member'),
      allowNull: false,
      defaultValue: 'Client',
    },
  },
  {
    sequelize,
    modelName: 'user',
    tableName: 'users',
  }
);

export default User;