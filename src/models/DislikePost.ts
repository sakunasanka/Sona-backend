// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/models/DislikePost.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Post from './Post';

class DislikePost extends Model {
  public id!: number;
  public userId!: number;
  public postId!: string;
  public readonly createdAt!: Date;
}

DislikePost.init(
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
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Post,
        key: 'id',
      },
      field: 'post_id',
    },
  },
  {
    sequelize,
    modelName: 'dislike_post',
    tableName: 'dislike_posts',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'post_id'],
      },
    ],
  }
);

// Define associations
DislikePost.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DislikePost.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
User.hasMany(DislikePost, { foreignKey: 'userId', as: 'postDislikes' });
Post.hasMany(DislikePost, { foreignKey: 'postId', as: 'dislikes' });

export default DislikePost;