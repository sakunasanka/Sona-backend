import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class Psychiatrist extends Model {
  public userId!: number;
  public specialization!: string[];  // e.g., ["Bipolar Disorder", "Schizophrenia"]
  public address?: string;
  public contact_no?: string;
  public licenseNo?: string;  // e.g., "SLMC-PSY-12345" (Sri Lanka Medical Council)
  public idCard?: string;  // path to ID card image or PDF
  public isAvailable!: boolean;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Psychiatrist.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    specialization: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    licenseNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idCard: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'psychiatrist',
    tableName: 'psychiatrists',
  }
);

// Set up associations
Psychiatrist.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Psychiatrist, { foreignKey: 'userId' });

export default Psychiatrist;