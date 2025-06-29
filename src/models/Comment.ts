// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/models/Comment.ts
import { DataTypes, Model, Association } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Post from './Post';

class Comment extends Model {
  public id!: string;
  public userId!: number;
  public postId!: string;
  public content!: string;
  public parentId?: string; // For nested comments/replies
  public likes!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  public readonly post?: Post;
  public readonly parent?: Comment; // Parent comment if this is a reply
  public readonly replies?: Comment[]; // Replies to this comment
  
  public static associations: {
    user: Association<Comment, User>;
    post: Association<Comment, Post>;
    parent: Association<Comment, Comment>;
    replies: Association<Comment, Comment>;
  };
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments', // Self-reference to the comments table
        key: 'id',
      },
      field: 'parent_id',
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    }
  },
  {
    sequelize,
    modelName: 'comment',
    tableName: 'comments',
  }
);

// Define associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Post.hasMany(Comment, { 
  foreignKey: 'postId', 
  as: 'comments',
  onDelete: 'CASCADE' // If post is deleted, delete all associated comments
});

// Self-association for nested comments/replies
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { 
  foreignKey: 'parentId', 
  as: 'replies',
  onDelete: 'CASCADE' // If parent comment is deleted, delete all replies
});

export default Comment;