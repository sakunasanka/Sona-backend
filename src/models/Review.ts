import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Counselor from './Counselor';

class Review extends Model {
  public reviewId!: number;
  public rating!: number;
  public comment?: string;
  public userId!: number;
  public counselorId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
  {
    reviewId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'review_id',
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      field: 'user_id',
    },
    counselorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Counselor,
        key: 'userId', // Note: In the Counselor model, userId is the primary key
      },
      field: 'counselor_id',
    },
  },
  {
    sequelize,
    modelName: 'review',
    tableName: 'reviews',
    timestamps: true, // This enables createdAt and updatedAt
  }
);

// Set up associations
Review.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Review, { foreignKey: 'userId' });

Review.belongsTo(Counselor, { foreignKey: 'counselorId', targetKey: 'userId' });
Counselor.hasMany(Review, { foreignKey: 'counselorId', sourceKey: 'userId' });

export default Review;