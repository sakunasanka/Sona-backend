import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Post from './Post';

class LikePost extends Model {
  public id!: number;
  public userId!: number;
  public postId!: string;
  public readonly createdAt!: Date;
}

LikePost.init(
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
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Post,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'like_post',
    tableName: 'like_posts',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'postId'],
      },
    ],
  }
);

// Define associations
LikePost.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LikePost.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
User.hasMany(LikePost, { foreignKey: 'userId', as: 'postLikes' });
Post.hasMany(LikePost, { foreignKey: 'postId', as: 'userLikes' });

export default LikePost;