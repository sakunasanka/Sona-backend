import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class Questionnaire extends Model {
  public id!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Questionnaire.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'questionnaire',
    tableName: 'questionnaires',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Questionnaire;