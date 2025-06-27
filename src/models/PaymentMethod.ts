import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

class PaymentMethod extends Model {
  public id!: number;
  public userId!: number;
  public type!: string;  // "Credit Card", "PayPal", etc.
  public last4?: string;  // Last 4 digits of card
  public brand?: string;  // "Visa", "Mastercard", etc.
  public isDefault!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PaymentMethod.init(
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
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last4: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'paymentMethod',
    tableName: 'payment_methods',
  }
);

// Set up association with User model
PaymentMethod.belongsTo(User, { foreignKey: 'userId' });

export default PaymentMethod;
