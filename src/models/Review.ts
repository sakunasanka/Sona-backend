import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Session from './Session';

export interface ReviewAttributes {
  review_id: number;
  sessionId: number;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ReviewCreationAttributes = Omit<ReviewAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public review_id!: number;
  public sessionId!: number;
  public rating!: number;
  public comment?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
  {
    review_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id',
      },
      field: 'session_id',
    },
    rating: {
      type: DataTypes.INTEGER,
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
  },
  {
    sequelize,
    modelName: 'review',
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      { fields: ['session_id'] },
      { fields: ['client_id'] },
      { fields: ['counselor_id'] },
      { fields: ['rating'] },
      { fields: ['created_at'] },
    ],
  }
);

// Define associations
Review.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });

Session.hasOne(Review, { foreignKey: 'sessionId', as: 'review' });

export default Review;