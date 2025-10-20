import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class EduQualification extends Model {
  public id!: number;
  public userId!: number;
  public institution!: string;
  public degree?: string;
  public field?: string;
  public startDate?: Date;
  public endDate?: Date;
  public grade?: string;
  public document?: string;
  public title?: string;
  public year?: number;
  public status?: 'pending' | 'approved' | 'rejected';
  public proof?: string; // Store file path/URL for certificate/diploma image or PDF
  public approvedAt?: Date;
  public approvedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EduQualification.init(
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
    institution: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    degree: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    field: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    document: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'File path or URL for certificate/diploma image or PDF'
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
    modelName: 'edu_qualification',
    tableName: 'edu_qualifications',
  }
);

export default EduQualification;