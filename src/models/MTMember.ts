// src/models/TeamMember.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

interface TeamMemberAttributes {
  id: string;
  userId: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  location: string;
  joinDate: Date;
  department: string;
  avatar: string;
  experience: string;
  skills: string[];
  bio: string;
  education: string[];
  certifications: string[];
  salary: string;
  reportingTo: string;
}

interface TeamMemberCreationAttributes extends Optional<TeamMemberAttributes, 'id' | 'avatar'> {}

interface PreviousRoleAttributes {
  id: string;
  teamMemberId: string;
  company: string;
  position: string;
  duration: string;
}

interface AchievementAttributes {
  id: string;
  teamMemberId: string;
  description: string;
}

class TeamMember extends Model<TeamMemberAttributes, TeamMemberCreationAttributes> implements TeamMemberAttributes {
  public id!: string;
  public userId!: number;
  public name!: string;
  public position!: string;
  public email!: string;
  public phone!: string;
  public location!: string;
  public joinDate!: Date;
  public department!: string;
  public avatar!: string;
  public experience!: string;
  public skills!: string[];
  public bio!: string;
  public education!: string[];
  public certifications!: string[];
  public salary!: string;
  public reportingTo!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  public readonly previousRoles?: PreviousRole[];
  public readonly achievements?: Achievement[];
}

class PreviousRole extends Model<PreviousRoleAttributes> implements PreviousRoleAttributes {
  public id!: string;
  public teamMemberId!: string;
  public company!: string;
  public position!: string;
  public duration!: string;
}

class Achievement extends Model<AchievementAttributes> implements AchievementAttributes {
  public id!: string;
  public teamMemberId!: string;
  public description!: string;
}

TeamMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    joinDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    education: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    salary: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reportingTo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'teamMember',
    tableName: 'team_members',
    timestamps: true,
  }
);

PreviousRole.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teamMemberId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: TeamMember,
        key: 'id',
      },
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'previousRole',
    tableName: 'previous_roles',
    timestamps: true,
  }
);

Achievement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teamMemberId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: TeamMember,
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'achievement',
    tableName: 'achievements',
    timestamps: true,
  }
);

// Define associations
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
TeamMember.hasMany(PreviousRole, { foreignKey: 'teamMemberId', as: 'previousRoles' });
TeamMember.hasMany(Achievement, { foreignKey: 'teamMemberId', as: 'achievements' });

export { TeamMember, PreviousRole, Achievement };