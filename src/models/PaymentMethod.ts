import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

// Define the attributes interface for PayHere payment transactions
interface PaymentMethodAttributes {
  paymentId: number;
  userId: number;
  transactionId: string;
  paymentGateway: 'payhere';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: Date;
  sessionData?: any;
  gatewayResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Define creation attributes (optional fields)
interface PaymentMethodCreationAttributes extends Optional<PaymentMethodAttributes, "paymentId" | "createdAt" | "updatedAt"> {}

class PaymentMethod extends Model<PaymentMethodAttributes, PaymentMethodCreationAttributes> implements PaymentMethodAttributes {
  public paymentId!: number;
  public userId!: number;
  public transactionId!: string;
  public paymentGateway!: 'payhere';
  public amount!: number;
  public currency!: string;
  public status!: 'pending' | 'completed' | 'failed' | 'refunded';
  public paymentDate!: Date;
  public sessionData?: any;
  public gatewayResponse?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Model methods for payment operations
  static async findByTransactionId(transactionId: string): Promise<PaymentMethod | null> {
    return this.findOne({
      where: { transactionId },
      include: [{ model: User, as: 'user' }]
    });
  }

  static async findByUserId(userId: number): Promise<PaymentMethod[]> {
    return this.findAll({
      where: { userId },
      include: [{ model: User, as: 'user' }],
      order: [['createdAt', 'DESC']]
    });
  }

  static async findCompletedPayments(): Promise<PaymentMethod[]> {
    return this.findAll({
      where: { status: 'completed' },
      include: [{ model: User, as: 'user' }],
      order: [['paymentDate', 'DESC']]
    });
  }

  static async getPaymentStats(userId?: number) {
    const whereClause = userId ? { userId } : {};
    
    return this.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['status'],
      raw: true
    });
  }

  // Instance methods
  async updateStatus(status: 'completed' | 'failed' | 'refunded', gatewayResponse?: any): Promise<PaymentMethod> {
    this.status = status;
    if (gatewayResponse) {
      this.gatewayResponse = gatewayResponse;
    }
    return this.save();
  }

  async isCompleted(): Promise<boolean> {
    return this.status === 'completed';
  }

  static async findByTransactionIdWithUser(transactionId: string): Promise<PaymentMethod | null> {
    return this.findOne({
        where: { transactionId },
        include: [{ model: User, as: 'user' }]
    });
}
}

PaymentMethod.init(
  {
    paymentId: {
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
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    paymentGateway: {
      type: DataTypes.ENUM('payhere'),
      allowNull: false,
      defaultValue: 'payhere'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'LKR',
      validate: {
        isIn: [['LKR', 'USD', 'EUR', 'GBP']]
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    sessionData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Session details associated with the payment'
    },
    gatewayResponse: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Response data from PayHere gateway'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'PaymentMethod',
    tableName: 'payment_transactions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['transactionId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentDate']
      },
      {
        fields: ['userId', 'status']
      }
    ],
    hooks: {
      beforeCreate: (payment: PaymentMethod) => {
        // Ensure paymentGateway is always 'payhere'
        payment.paymentGateway = 'payhere';
      },
      beforeUpdate: (payment: PaymentMethod) => {
        // Sequelize will automatically update the updatedAt timestamp
        payment.set('updatedAt', new Date());
      }
    }
  }
);

// Set up association with User model
PaymentMethod.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default PaymentMethod;
export { PaymentMethodAttributes, PaymentMethodCreationAttributes };
