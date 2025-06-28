import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Client extends Model {
  public userId!: number;
  public university?: string;
  public universityId?: string;
  public universityEmail?: string;
  public isStudent!: boolean;
  public nickName?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Client.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    university: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    universityId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    universityEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    isStudent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    nickName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'client',
    tableName: 'clients',
  }
);

// Set up associations
Client.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Client, { foreignKey: 'userId' });

export default Client;