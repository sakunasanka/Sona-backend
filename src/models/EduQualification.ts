import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class EduQualification extends Model {
  public id!: number;
  public userId!: number;
  public institution?: string;
  public degree?: string;
  public field?: string;
  public startDate?: Date;
  public endDate?: Date | null;  // null means currently studying
  public grade?: string;  // e.g., "First Class", "Distinction", "3.8 GPA"
  public document?: string;  // path to document file (PDF, image, etc.)
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
        model: User,
        key: 'id',
      },
    },
    institution: {
      type: DataTypes.STRING,
      allowNull: true,
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
      comment: 'Path to document file (PDF, image, etc.)',
    },
  },
  {
    sequelize,
    modelName: 'eduQualification',
    tableName: 'edu_qualifications',
  }
);

// Set up associations
EduQualification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(EduQualification, { foreignKey: 'userId' });

export default EduQualification;