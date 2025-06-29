// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/models/LikeComment.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Comment from './Comment';

class LikeComment extends Model {
  public id!: number;
  public userId!: number;
  public commentId!: string;
  public readonly createdAt!: Date;
}

LikeComment.init(
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
    commentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Comment,
        key: 'id',
      },
      field: 'comment_id',
    },
  },
  {
    sequelize,
    modelName: 'like_comment',
    tableName: 'like_comments',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'commentId'],
      },
    ],
  }
);

// Define associations
LikeComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LikeComment.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });
User.hasMany(LikeComment, { foreignKey: 'userId', as: 'commentLikes' });
Comment.hasMany(LikeComment, { foreignKey: 'commentId', as: 'likes' });

export default LikeComment;