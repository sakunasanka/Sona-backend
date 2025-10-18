import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Session from './Session';

export interface ReviewAttributes {
  review_id: number;
  userId: number;
  sessionId: number;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ReviewCreationAttributes = Optional<ReviewAttributes, 'review_id' | 'userId' | 'createdAt' | 'updatedAt'>;

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public review_id!: number;
  public userId!: number;
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'user_id',
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
      { fields: ['user_id'] },
      { fields: ['client_id'] },
      { fields: ['counselor_id'] },
      { fields: ['rating'] },
      { fields: ['created_at'] },
    ],
  }
);

// Define associations
Review.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Session.hasOne(Review, { foreignKey: 'sessionId', as: 'review' });

export default Review;