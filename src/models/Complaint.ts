// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/models/Complaint.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Session from './Session';

class Complaint extends Model {
  public id!: number;
  public complaint!: string;
  public status!: 'pending' | 'resolved' | 'rejected' | 'in review';
  public proof?: string;  // Optional field for proof (e.g. file path or URL)
  public userId!: number;  // User who submitted the complaint
  public sessionId!: number;  // Related session
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Complaint.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'complaintId'
    },
    complaint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'rejected', 'in review'),
      defaultValue: 'pending',
      allowNull: false,
    },
    proof: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      field: 'user_id',
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Session,
        key: 'id',
      },
      field: 'session_id',
    },
  },
  {
    sequelize,
    modelName: 'complaint',
    tableName: 'complaints',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['session_id'],
      },
    ],
  }
);

// Associations
Complaint.belongsTo(User, { foreignKey: 'userId' });
Complaint.belongsTo(Session, { foreignKey: 'sessionId' });
User.hasMany(Complaint, { foreignKey: 'userId' });
Session.hasMany(Complaint, { foreignKey: 'sessionId' });

export default Complaint;