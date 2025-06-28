import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class MTMember extends Model {
  public userId!: number;
  public memberId!: string;
  public responsibility!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MTMember.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    memberId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    responsibility: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: 'mtMember',
    tableName: 'mt_members',
  }
);

// Set up associations
MTMember.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(MTMember, { foreignKey: 'userId' });

export default MTMember;