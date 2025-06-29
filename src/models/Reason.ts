// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/models/Reason.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class Reason extends Model {
  public id!: number;
  public reasonName!: string;
  public reason!: string;
  public reasonType!: 'post_reject' | 'user_deactivate' | 'complaint_rejected' | 'session_cancelled';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Reason.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'reasonId'
    },
    reasonName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reasonType: {
      type: DataTypes.ENUM('post_reject', 'user_deactivate', 'complaint_rejected', 'session_cancelled'),
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: 'reason',
    tableName: 'reasons',
    indexes: [
      {
        fields: ['reasonType'],
      }
    ]
  }
);

export default Reason;