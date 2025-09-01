import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

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

class QuestionnaireResult extends Model<QuestionnaireResultAttributes, QuestionnaireResultCreationAttributes> 
  implements QuestionnaireResultAttributes {
  
  public id!: string;
  public userId!: number;
  public questionnaireType!: 'PHQ9';
  public responses!: PHQ9Response[];
  public totalScore!: number;
  public severity!: 'Minimal or none' | 'Mild' | 'Moderate' | 'Moderately severe' | 'Severe';
  public impact?: string;
  public hasItem9Positive!: boolean;
  public completedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;

  // Association with User
  public User?: User;

  /**
   * Calculate PHQ-9 severity based on total score
   */
  public static calculateSeverity(score: number): QuestionnaireResultAttributes['severity'] {
    if (score >= 0 && score <= 4) return 'Minimal or none';
    if (score >= 5 && score <= 9) return 'Mild';
    if (score >= 10 && score <= 14) return 'Moderate';
    if (score >= 15 && score <= 19) return 'Moderately severe';
    if (score >= 20 && score <= 27) return 'Severe';
    throw new Error('Invalid PHQ-9 score. Score must be between 0 and 27.');
  }

  /**
   * Calculate total score from responses
   */
  public static calculateTotalScore(responses: PHQ9Response[]): number {
    if (responses.length !== 9) {
      throw new Error('PHQ-9 must have exactly 9 responses');
    }
    return responses.reduce((total, response) => {
      if (response.answer < 0 || response.answer > 3) {
        throw new Error('Each PHQ-9 response must be between 0 and 3');
      }
      return total + response.answer;
    }, 0);
  }

  /**
   * Check if item 9 (suicidal ideation) is positive
   */
  public static checkItem9Positive(responses: PHQ9Response[]): boolean {
    const item9 = responses.find(r => r.questionIndex === 8); // Item 9 is index 8
    return item9 ? item9.answer > 0 : false;
  }

  /**
   * Validate PHQ-9 responses
   */
  public static validateResponses(responses: PHQ9Response[]): void {
    if (!Array.isArray(responses)) {
      throw new Error('Responses must be an array');
    }
    
    if (responses.length !== 9) {
      throw new Error('PHQ-9 must have exactly 9 responses');
    }

    // Check for duplicate question indices
    const indices = responses.map(r => r.questionIndex);
    const uniqueIndices = new Set(indices);
    if (uniqueIndices.size !== 9) {
      throw new Error('Each question must be answered exactly once');
    }

    // Validate question indices are 0-8
    const validIndices = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    for (const index of indices) {
      if (!validIndices.has(index)) {
        throw new Error(`Invalid question index: ${index}. Must be between 0 and 8.`);
      }
    }

    // Validate answers are 0-3
    for (const response of responses) {
      if (typeof response.answer !== 'number' || response.answer < 0 || response.answer > 3) {
        throw new Error(`Invalid answer for question ${response.questionIndex}. Must be between 0 and 3.`);
      }
    }
  }

  /**
   * Find user's questionnaire history
   */
  public static async findUserHistory(userId: number, limit: number = 10, offset: number = 0) {
    return await QuestionnaireResult.findAndCountAll({
      where: { 
        userId,
        deletedAt: { [Op.is]: null }
      } as any,
      order: [['completedAt', 'DESC']],
      limit,
      offset,
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });
  }

  /**
   * Find user's latest result
   */
  public static async findUserLatest(userId: number) {
    return await QuestionnaireResult.findOne({
      where: { 
        userId,
        deletedAt: { [Op.is]: null }
      } as any,
      order: [['completedAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });
  }

  /**
   * Get analytics data for counselors/admins
   */
  public static async getAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    hasItem9Positive?: boolean;
  } = {}) {
    const whereClause: any = { deletedAt: { [Op.is]: null } };
    
    if (filters.startDate) {
      whereClause.completedAt = { ...whereClause.completedAt, [Op.gte]: filters.startDate };
    }
    if (filters.endDate) {
      whereClause.completedAt = { ...whereClause.completedAt, [Op.lte]: filters.endDate };
    }
    if (filters.severity) {
      whereClause.severity = filters.severity;
    }
    if (filters.hasItem9Positive !== undefined) {
      whereClause.hasItem9Positive = filters.hasItem9Positive;
    }

    return await QuestionnaireResult.findAll({
      where: whereClause,
      attributes: [
        'severity',
        'totalScore',
        'hasItem9Positive',
        'completedAt',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['severity', 'totalScore', 'hasItem9Positive', 'completedAt'],
      order: [['completedAt', 'DESC']]
    });
  }

  /**
   * Soft delete a result
   */
  public async softDelete(): Promise<void> {
    this.deletedAt = new Date();
    await this.save();
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
      references: {
        model: 'users',
        key: 'id',
      },
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
      validate: {
        isValidResponses(value: PHQ9Response[]) {
          QuestionnaireResult.validateResponses(value);
        },
      },
    },
    totalScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_score',
      validate: {
        min: 0,
        max: 27,
      },
    },
    severity: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['Minimal or none', 'Mild', 'Moderate', 'Moderately severe', 'Severe']],
      },
    },
    impact: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    hasItem9Positive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_item9_positive',
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
    paranoid: false, // We handle soft deletion manually
    hooks: {
      beforeCreate: (instance: QuestionnaireResult) => {
        // Validate and calculate fields before creation
        QuestionnaireResult.validateResponses(instance.responses);
        instance.totalScore = QuestionnaireResult.calculateTotalScore(instance.responses);
        instance.severity = QuestionnaireResult.calculateSeverity(instance.totalScore);
        instance.hasItem9Positive = QuestionnaireResult.checkItem9Positive(instance.responses);
      },
      beforeUpdate: (instance: QuestionnaireResult) => {
        // Recalculate if responses are updated
        if (instance.changed('responses')) {
          QuestionnaireResult.validateResponses(instance.responses);
          instance.totalScore = QuestionnaireResult.calculateTotalScore(instance.responses);
          instance.severity = QuestionnaireResult.calculateSeverity(instance.totalScore);
          instance.hasItem9Positive = QuestionnaireResult.checkItem9Positive(instance.responses);
        }
      },
    },
  }
);

// Define associations
QuestionnaireResult.belongsTo(User, {
  foreignKey: 'userId',
  as: 'User',
});

User.hasMany(QuestionnaireResult, {
  foreignKey: 'userId',
  as: 'QuestionnaireResults',
});

export default QuestionnaireResult;
