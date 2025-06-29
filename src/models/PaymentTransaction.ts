import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Session from './Session';

class PaymentTransaction extends Model {
  public id!: number;
  public userId!: number;
  public sessionId?: number; // Optional as platform fee may not be tied to a specific session
  public paymentFor!: 'platform_fee' | 'session_fee';
  public amount!: number;
  public currency!: string;
  public status!: 'success' | 'failed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PaymentTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'paymentId'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      field: 'user_id'
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Session,
        key: 'id',
      },
      field: 'session_id'
    },
    paymentFor: {
      type: DataTypes.ENUM('platform_fee', 'session_fee'),
      allowNull: false,
      field: 'payment_for'
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'LKR' // Default currency as Sri Lankan Rupee
    },
    status: {
      type: DataTypes.ENUM('success', 'failed'),
      allowNull: false,
      defaultValue: 'success'
    },
  },
  {
    sequelize,
    modelName: 'paymentTransaction',
    tableName: 'payment_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['session_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['payment_for']
      }
    ]
  }
);

// Set up associations
PaymentTransaction.belongsTo(User, { foreignKey: 'userId' });
PaymentTransaction.belongsTo(Session, { foreignKey: 'sessionId' });
User.hasMany(PaymentTransaction, { foreignKey: 'userId' });
Session.hasMany(PaymentTransaction, { foreignKey: 'sessionId' });

export default PaymentTransaction;
