import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class User extends Model {
  public id!: number;
  public firebaseId!: string;
  public name!: string;
  public email!: string;
  public avatar?: string;
  public role!: 'Client' | 'Counselor' | 'Admin' | 'Psychiatrist' | 'MT-Team';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async updateProfile(data: {name?: string; avatar?: string}) {
    return await this.update(data);
  }

  public async upgradeToPremium() {
    return await this.update({ badge: 'Premium'});
  }

  public isClient(): boolean {
    return this.role === 'Client';
  }

  public isCounselor(): boolean {
    return this.role === 'Counselor';
  }

  public async getUserDetails(userId: number): Promise<User | null >{
    return await User.findByPk(userId, {
      attributes: ['id', 'firebaseId', 'name', 'email', 'avatar', 'role'],
    });
  }
  
  public static async getUserDetails(userId: number): Promise<User | null> {
    return await User.findByPk(userId, {
      attributes: ['id', 'firebaseId', 'name', 'email', 'avatar', 'role'],
    });
  }
}


User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firebaseId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('Client', 'Counselor' , 'Admin', 'Psychiatrist', 'MT-Team'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'user',
    tableName: 'users',
  }
);

export default User;