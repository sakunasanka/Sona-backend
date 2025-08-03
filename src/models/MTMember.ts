import { DataTypes, Model, Optional  } from 'sequelize';
import { sequelize } from '../config/db';

interface TeamMemberAttributes {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  department: string;
  avatar: string;
  experience: string;
  skills: string[];
  bio: string;
  education: string[];
  certifications: string[];
  previousRoles: Array<{
    company: string;
    position: string;
    duration: string;
  }>;
  achievements: string[];
  salary: string;
  reportingTo: string;
  status?: 'active' | 'rejected';
  rejectionReason?: string;
  rejectionEmailSent?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeamMemberCreationAttributes extends Optional<TeamMemberAttributes, 'id'> {}

class MtMember extends Model<TeamMemberAttributes, TeamMemberCreationAttributes> implements TeamMemberAttributes {
  public id!: string;
  public name!: string;
  public position!: string;
  public email!: string;
  public phone!: string;
  public location!: string;
  public joinDate!: string;
  public department!: string;
  public avatar!: string;
  public experience!: string;
  public skills!: string[];
  public bio!: string;
  public education!: string[];
  public certifications!: string[];
  public previousRoles!: Array<{
    company: string;
    position: string;
    duration: string;
  }>;
  public achievements!: string[];
  public salary!: string;
  public reportingTo!: string;
  public status!: 'active' | 'rejected';
  public rejectionReason?: string;
  public rejectionEmailSent?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MtMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    education: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    previousRoles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    achievements: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    salary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reportingTo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'rejected'),
      defaultValue: 'active',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectionEmailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'mt_members',
    timestamps: true,
  }
);

export default MtMember;