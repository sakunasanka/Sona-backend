import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import Client from './Client';

interface StudentAttributes {
  id: number;
  clientId: number;
  university: string;
  universityId: string;
  universityEmail: string;
  graduationYear?: string;
  verificationDocument?: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  appliedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface StudentCreationAttributes extends Optional<StudentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: number;
  public clientId!: number;
  public university!: string;
  public universityId!: string;
  public universityEmail!: string;
  public graduationYear?: string;
  public verificationDocument?: string;
  public applicationStatus!: 'pending' | 'approved' | 'rejected';
  public rejectionReason?: string;
  public appliedDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'userId'
      }
    },
    university: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    universityId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    universityEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    graduationYear: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    verificationDocument: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    applicationStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    appliedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'student',
    tableName: 'students',
    timestamps: true,
  }
);

// Define associations
Student.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client',
});

export default Student;