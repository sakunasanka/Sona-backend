// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/models/DislikeReview.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Review from './Review';

class DislikeReview extends Model {
  public id!: number;
  public userId!: number;
  public reviewId!: number;
  public readonly createdAt!: Date;
}

DislikeReview.init(
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
    modelName: 'dislike_review',
    tableName: 'dislike_reviews',
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
DislikeReview.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DislikeReview.belongsTo(Review, { foreignKey: 'reviewId', as: 'review' });
User.hasMany(DislikeReview, { foreignKey: 'userId', as: 'reviewDislikes' });
Review.hasMany(DislikeReview, { foreignKey: 'reviewId', as: 'dislikes' });

export default DislikeReview;