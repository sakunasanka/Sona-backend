// models/RejectionReason.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class RejectionReason extends Model {
  public userId!: number;
  public reason!: string;
  public readonly createdAt!: Date;
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
  },
  {
    sequelize,
    modelName: 'rejection_reason',
    tableName: 'rejection_reasons',
    timestamps: true,
    updatedAt: false, // We only need createdAt
  }
);

export default RejectionReason;