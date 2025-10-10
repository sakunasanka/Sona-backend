import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class Experience extends Model {
  public id!: number;
  public userId!: number;
  public title!: string;
  public description!: string;
  public date!: string; // Year or date range like "2024" or "2022-2024"
  public status!: 'pending' | 'approved' | 'rejected';
  public proof?: string; // Store file path/URL for certificate/award image or PDF
  public verificationDocument?: string;
  public approvedAt?: Date;
  public approvedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Experience.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'File path or URL for experience certificate/award image or PDF'
    },
    verificationDocument: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
  },
  {
    sequelize,
    modelName: 'experience',
    tableName: 'experiences',
  }
);

export default Experience;