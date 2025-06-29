// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/models/DislikeComment.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Comment from './Comment';

class DislikeComment extends Model {
  public id!: number;
  public userId!: number;
  public commentId!: string;
  public readonly createdAt!: Date;
}

DislikeComment.init(
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
    modelName: 'dislike_comment',
    tableName: 'dislike_comments',
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
DislikeComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DislikeComment.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });
User.hasMany(DislikeComment, { foreignKey: 'userId', as: 'commentDislikes' });
Comment.hasMany(DislikeComment, { foreignKey: 'commentId', as: 'dislikes' });

export default DislikeComment;