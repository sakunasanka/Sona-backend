import { DataTypes, Model, Optional  } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class mt_members extends Model{
  public userId!: number;
  public position!: string;
  public phone!: string;
  public location!: string;
  public joinDate!: string;
  public department!: string;
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
  //public reportingTo!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

mt_members.init(
  {
     userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
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
    // reportingTo: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // }
  },
  {
    sequelize,
    tableName: 'mt_members',
    timestamps: true,
  }
);

mt_members.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default mt_members;