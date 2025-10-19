// models/RejectionReason.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class RejectionReason extends Model {
  public userId!: number;
  public reason!: string;
  public readonly createdAt!: Date;
  public rejectedBy!: number; // Add this field
}

RejectionReason.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rejectedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'rejection_reason',
    tableName: 'rejection_reasons',
    timestamps: true,
    updatedAt: false,
  }
);

export default RejectionReason;