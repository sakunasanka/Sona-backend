import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class Experience extends Model {
  public id!: number;
  public userId!: number;
  public position!: string;
  public company!: string;
  public title!: string;
  public description!: string;
  public startDate!: Date;
  public endDate! : Date;
  public status!: 'pending' | 'approved' | 'rejected';
  public proof?: string;
  public document?: string;
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
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
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
    document: {
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