import { DataTypes, Model, Association } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import PostLike from './PostLike';

class Post extends Model {
  public id!: string;
  public userId!: number;
  public content!: string;
  public hashtags!: string[];
  public views!: number;
  public likes!: number;
  public comments!: number;
  public backgroundColor!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association
  public readonly user?: User;
  public static associations: {
    user: Association<Post, User>;
  };
}

Post.init(
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
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hashtags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    comments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    backgroundColor: {
      type: DataTypes.STRING,
      defaultValue: '#FFFFFF',
    },
  },
  {
    sequelize,
    modelName: 'post',
    tableName: 'posts',
  }
);

// Define associations
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.hasMany(PostLike, { foreignKey: 'postId' });
Post.belongsToMany(User, { through: PostLike, foreignKey: 'postId', as: 'likingUsers' });


export default Post;