import { DataTypes, Model, Optional, Op, Sequelize } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { decrypt, encrypt } from '../middlewares/encrypt';

// Helper function to check if a value is encrypted (contains colons as separators)
const isEncrypted = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
};

// Safe decrypt function that handles both encrypted and unencrypted data
const safeDecrypt = (value: string): string => {
  if (!value) return '';
  if (isEncrypted(value)) {
    try {
      return decrypt(value);
    } catch (error) {
      console.warn('Failed to decrypt value, returning as-is:', error);
      return value;
    }
  }
  return value;
};

// Define the interface for PHQ-9 response
export interface PHQ9Response {
  questionIndex: number; // 0-8 for PHQ-9 questions
  answer: number; // 0-3 (0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day)
}

// Define the questionnaire result attributes
export interface QuestionnaireResultAttributes {
  id: string;
  userId: number;
  questionnaireType: 'PHQ9';
  responses: PHQ9Response[];
  totalScore: number;
  severity: 'Minimal or none' | 'Mild' | 'Moderate' | 'Moderately severe' | 'Severe';
  impact?: string;
  hasItem9Positive: boolean;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Define creation attributes (optional fields for creation)
export interface QuestionnaireResultCreationAttributes 
  extends Optional<QuestionnaireResultAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

// It's a good practice to create a helper type for severity
export type SeverityType = QuestionnaireResultAttributes['severity'];

class QuestionnaireResult extends Model<QuestionnaireResultAttributes, QuestionnaireResultCreationAttributes> 
  implements QuestionnaireResultAttributes {
  
  public id!: string;
  public userId!: number;
  public questionnaireType!: 'PHQ9';
  public responses!: PHQ9Response[];
  public totalScore!: number;
  public severity!: SeverityType;
  public impact?: string;
  public hasItem9Positive!: boolean;
  public completedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;

  // Association with User
  public User?: User;

  // --- (All static methods like calculateSeverity, findUserHistory, etc. remain unchanged) ---
  public static calculateSeverity(score: number): SeverityType {
    if (score >= 0 && score <= 4) return 'Minimal or none';
    if (score >= 5 && score <= 9) return 'Mild';
    if (score >= 10 && score <= 14) return 'Moderate';
    if (score >= 15 && score <= 19) return 'Moderately severe';
    if (score >= 20 && score <= 27) return 'Severe';
    throw new Error('Invalid PHQ-9 score. Score must be between 0 and 27.');
  }

  public static calculateTotalScore(responses: PHQ9Response[]): number {
    if (!responses || responses.length !== 9) {
      throw new Error('PHQ-9 must have exactly 9 responses');
    }
    return responses.reduce((total, response) => {
      if (response.answer < 0 || response.answer > 3) {
        throw new Error('Each PHQ-9 response must be between 0 and 3');
      }
      return total + response.answer;
    }, 0);
  }

  public static checkItem9Positive(responses: PHQ9Response[]): boolean {
    const item9 = responses.find(r => r.questionIndex === 8); // Item 9 is index 8
    return item9 ? item9.answer > 0 : false;
  }
  
  public static validateResponses(responses: PHQ9Response[]): void {
    if (!Array.isArray(responses)) {
      throw new Error('Responses must be an array');
    }
    
    if (responses.length !== 9) {
      throw new Error('PHQ-9 must have exactly 9 responses');
    }

    const indices = responses.map(r => r.questionIndex);
    const uniqueIndices = new Set(indices);
    if (uniqueIndices.size !== 9) {
      throw new Error('Each question must be answered exactly once');
    }

    const validIndices = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    for (const index of indices) {
      if (!validIndices.has(index)) {
        throw new Error(`Invalid question index: ${index}. Must be between 0 and 8.`);
      }
    }

    for (const response of responses) {
      if (typeof response.answer !== 'number' || response.answer < 0 || response.answer > 3) {
        throw new Error(`Invalid answer for question ${response.questionIndex}. Must be between 0 and 3.`);
      }
    }
  }

  public static async findUserHistory(userId: number, limit: number = 10, offset: number = 0) {
    return this.findAndCountAll({
      where: { userId },
      order: [['completedAt', 'DESC']],
      limit,
      offset,
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email']
      }]
    });
  }

  public static async findUserLatest(userId: number) {
    return this.findOne({
      where: { userId },
      order: [['completedAt', 'DESC']],
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email']
      }]
    });
  }

  public static async getAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    severity?: SeverityType;
    hasItem9Positive?: boolean;
  } = {}) {
    const whereClause: any = {};
    
    if (filters.startDate) {
      whereClause.completedAt = { ...whereClause.completedAt, [Op.gte]: filters.startDate };
    }
    if (filters.endDate) {
      whereClause.completedAt = { ...whereClause.completedAt, [Op.lte]: filters.endDate };
    }
    if (filters.severity) {
      whereClause.severity = encrypt(filters.severity);
    }
    if (filters.hasItem9Positive !== undefined) {
      whereClause.hasItem9Positive = encrypt(filters.hasItem9Positive.toString());
    }

    return this.findAll({
      where: whereClause,
      attributes: ['severity', 'totalScore', 'hasItem9Positive', 'completedAt'],
      order: [['completedAt', 'DESC']]
    });
  }

  public async softDelete(): Promise<void> {
    this.setDataValue('deletedAt', new Date());
    await this.save();
  }

  // ✅ =================================================================
  // ✅ ADD THIS METHOD TO FIX THE DECRYPTION PROBLEM
  // ✅ This method is called by JSON.stringify() (and res.json())
  // ✅ =================================================================
  public toJSON(): QuestionnaireResultAttributes {
    // Get all attributes from the model instance
    const attributes = super.toJSON() as QuestionnaireResultAttributes;

    // The `super.toJSON()` method will *already* have triggered
    // all the `get()` methods defined in `QuestionnaireResult.init`.
    // This function now simply ensures that the object returned
    // is the clean, decrypted version.
    
    return attributes;
  }
}

QuestionnaireResult.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
    },
    questionnaireType: {
      type: DataTypes.ENUM('PHQ9'),
      allowNull: false,
      defaultValue: 'PHQ9',
      field: 'questionnaire_type',
    },
    responses: {
      type: DataTypes.JSONB,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('responses' as any);
        if (!rawValue || !Array.isArray(rawValue)) {
          return [];
        }
        
        // Decrypt only the answer values, keep questionIndex as-is
        return rawValue.map((response: any) => ({
          questionIndex: response.questionIndex,
          answer: response.answer && isEncrypted(response.answer) 
            ? parseInt(safeDecrypt(response.answer), 10)
            : (typeof response.answer === 'number' ? response.answer : parseInt(response.answer, 10))
        })) as PHQ9Response[];
      },
      set(value: PHQ9Response[]) {
        if (!value || !Array.isArray(value)) {
          this.setDataValue('responses' as any, []);
          return;
        }
        
        // ✅ Simplified: Validation is now only in the hook
        
        // Encrypt only the answer values, keep questionIndex in plain text
        const encryptedResponses = value.map(response => ({
          questionIndex: response.questionIndex,
          answer: encrypt(response.answer.toString())
        }));
        
        this.setDataValue('responses' as any, encryptedResponses);
      },
    },
    totalScore: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'total_score',
      get() {
        const rawValue = this.getDataValue('totalScore' as any);
        if (!rawValue) return 0;
        
        // Handle both encrypted and unencrypted values
        if (isEncrypted(rawValue)) {
          return parseInt(safeDecrypt(rawValue), 10);
        } else {
          // Legacy data
          return typeof rawValue === 'number' ? rawValue : parseInt(rawValue, 10);
        }
      },
      set(value: number) {
        this.setDataValue('totalScore' as any, encrypt(value.toString()));
      }
    },
    severity: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('severity' as any);
        if (!rawValue) return 'Minimal or none';
        
        // Handle both encrypted and unencrypted values
        if (isEncrypted(rawValue)) {
          return safeDecrypt(rawValue) as SeverityType;
        } else {
          // Legacy data
          return rawValue as SeverityType;
        }
      },
      set(value: SeverityType) {
        this.setDataValue('severity' as any, encrypt(value));
      }
    },
    impact: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('impact' as any);
        if (!rawValue) return undefined;
        
        // Handle both encrypted and unencrypted values
        if (isEncrypted(rawValue)) {
          return safeDecrypt(rawValue);
        } else {
          // Legacy data
          return rawValue;
        }
      },
      set(value: string | undefined) {
        this.setDataValue('impact' as any, value ? encrypt(value) : null);
      }
    },
    hasItem9Positive: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'has_item9_positive',
      get() {
        const rawValue = this.getDataValue('hasItem9Positive' as any);
        if (!rawValue) return false;
        
        // Handle both encrypted and unencrypted values
        if (isEncrypted(rawValue)) {
          return safeDecrypt(rawValue) === 'true';
        } else {
          // Legacy data
          return typeof rawValue === 'boolean' ? rawValue : rawValue === 'true';
        }
      },
      set(value: boolean) {
        this.setDataValue('hasItem9Positive' as any, encrypt(value.toString()));
      }
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'completed_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    modelName: 'QuestionnaireResult',
    tableName: 'questionnaire_results',
    timestamps: true,
    paranoid: true,
    hooks: {
      beforeValidate: (instance: QuestionnaireResult) => {
        // This hook runs on create and update.
        // It reads `instance.responses` (which triggers the GETTER to decrypt)
        // and uses the clean data to calculate the other fields.
        
        if (instance.isNewRecord || instance.changed('responses')) {
          // 1. Validate the (decrypted) responses
          QuestionnaireResult.validateResponses(instance.responses);

          // 2. Calculate score from (decrypted) responses
          const score = QuestionnaireResult.calculateTotalScore(instance.responses);
          
          // 3. These assignments will trigger their respective encrypted SETTERS
          instance.totalScore = score;
          instance.severity = QuestionnaireResult.calculateSeverity(score);
          instance.hasItem9Positive = QuestionnaireResult.checkItem9Positive(instance.responses);
        }
      },
    },
  }
);

QuestionnaireResult.belongsTo(User, { foreignKey: 'userId', as: 'User' });
User.hasMany(QuestionnaireResult, { foreignKey: 'userId', as: 'QuestionnaireResults' });

export default QuestionnaireResult;