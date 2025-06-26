import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Counselor extends Model {
  public userId!: number;
  public title!: string;  // e.g., "Licensed Clinical Psychologist"
  public specialties!: string[];  // e.g., ["Anxiety", "Depression", "Trauma"]
  public bio?: string;
  public rating?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Counselor.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'counselor',
    tableName: 'counselors',
  }
);

// Set up associations
Counselor.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Counselor, { foreignKey: 'userId' });

export default Counselor;
