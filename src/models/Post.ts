import { DataTypes, Model, Association } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Post extends Model {
  public id!: string;
  public userId!: number;
  public content!: string;
  public hashtags!: string[];
  public views!: number;
  public likes!: number;
  public comments!: number;
  public backgroundColor!: string;
  public image?: string;
  public status?: string;
  public isAnonymous!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public actionBy?: number;
  public actionAt?: Date;
  public rejectedReason?: string;

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
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'edited'),
      defaultValue: 'pending',
      allowNull: true,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    actionBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      }
    },
    actionAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'post',
    tableName: 'posts',
    hooks: {
      beforeUpdate: (post: Post) => {
        // If content changes and post was previously approved/rejected, set status to 'edited'
        if (post.changed('content') && 
            (post.previous('status') === 'approved' || post.previous('status') === 'rejected')) {
          post.status = 'edited';
        }
      }
    }
  }
);

// Define associations
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.belongsTo(User, { foreignKey: 'actionBy', as: 'actionUser' });
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });

export default Post;