import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class ComplaintLogs extends Model {
  public id!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ComplaintLogs.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'complaintLogs',
    tableName: 'complaint_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ComplaintLogs;