import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Experience extends Model {
  public id!: number;
  public userId!: number;
  public company?: string;
  public position?: string;
  public startDate?: Date;
  public endDate?: Date | null;  // null means currently working
  public description?: string;
  public document?: string;  // path to document file (PDF, image, etc.)
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
        model: User,
        key: 'id',
      },
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
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
    description: {
      type: DataTypes.TEXT,
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
    modelName: 'experience',
    tableName: 'experiences',
  }
);

// Set up associations
Experience.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Experience, { foreignKey: 'userId' });

export default Experience;