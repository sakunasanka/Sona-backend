import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import User from "./User";
import Post from "./Post";

class PostLike extends Model {
  public id!: number;
  public userId!: number;
  public postId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PostLike.init({
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
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Post,
      key: 'id',
    },
  },
}, {
  sequelize,
  tableName: 'post_likes',
  timestamps: true,
  // Ensure a user can only like a post once
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId']
    }
  ]
});

export default PostLike;