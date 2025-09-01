const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('questionnaire_results', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      questionnaire_type: {
        type: DataTypes.ENUM('PHQ9'),
        allowNull: false,
        defaultValue: 'PHQ9',
      },
      responses: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'JSON array of 9 question responses with questionIndex and answer',
      },
      total_score: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
        comment: 'How difficult these problems have made it to work, take care of things, or get along with people',
      },
      has_item9_positive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Tracks if item 9 (suicidal ideation) was answered positively for risk monitoring',
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'For soft deletion if needed',
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex('questionnaire_results', ['user_id']);
    await queryInterface.addIndex('questionnaire_results', ['questionnaire_type']);
    await queryInterface.addIndex('questionnaire_results', ['completed_at']);
    await queryInterface.addIndex('questionnaire_results', ['has_item9_positive']);
    await queryInterface.addIndex('questionnaire_results', ['user_id', 'questionnaire_type', 'completed_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('questionnaire_results');
  },
};
