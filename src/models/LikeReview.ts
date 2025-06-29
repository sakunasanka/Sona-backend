// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/models/LikeReview.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Review from './Review';

class LikeReview extends Model {
  public id!: number;
  public userId!: number;
  public reviewId!: number;
  public readonly createdAt!: Date;
}

LikeReview.init(
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
      field: 'user_id',
    },
    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Review,
        key: 'reviewId',
      },
      field: 'review_id',
    },
  },
  {
    sequelize,
    modelName: 'like_review',
    tableName: 'like_reviews',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'reviewId'],
      },
    ],
  }
);

// Define associations
LikeReview.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LikeReview.belongsTo(Review, { foreignKey: 'reviewId', as: 'review' });
User.hasMany(LikeReview, { foreignKey: 'userId', as: 'reviewLikes' });
Review.hasMany(LikeReview, { foreignKey: 'reviewId', as: 'userLikes' });

export default LikeReview;