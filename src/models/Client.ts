import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Client extends Model {
  public userId!: number;
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