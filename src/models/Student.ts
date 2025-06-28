import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import Client from './Client';

class Student extends Model {
  public clientId!: number;
  public university!: string;
  public universityId!: string;
  public universityEmail!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init(
  {
    clientId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Client,
        key: 'userId',
      },
    },
    university: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    universityId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    universityEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    }
  },
  {
    sequelize,
    modelName: 'student',
    tableName: 'students',
  }
);

// Set up associations
Student.belongsTo(Client, { foreignKey: 'clientId' });
Client.hasOne(Student, { foreignKey: 'clientId' });

export default Student;
