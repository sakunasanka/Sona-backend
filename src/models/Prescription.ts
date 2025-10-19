import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Prescription extends Model {
  public id!: number;
  public psychiatristId!: number;
  public clientId!: number;
  public description?: string;
  public prescription!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Prescription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    psychiatristId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'psychiatrist_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'client_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'prescription',
    tableName: 'prescriptions',
    underscored: true,
    timestamps: true,
  }
);

// Define associations
Prescription.belongsTo(User, { 
  foreignKey: 'clientId', 
  as: 'client'
});

Prescription.belongsTo(User, { 
  foreignKey: 'psychiatristId', 
  as: 'psychiatrist'
});

export default Prescription;