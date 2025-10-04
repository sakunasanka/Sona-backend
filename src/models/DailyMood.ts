import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

export interface DailyMoodAttributes {
	id: number;
	user_id: number;
	local_date: string; // YYYY-MM-DD
	mood: 'happy' | 'calm' | 'focused' | 'relaxed';
}

type DailyMoodCreationAttributes = Optional<DailyMoodAttributes, 'id'>;

class DailyMood extends Model<DailyMoodAttributes, DailyMoodCreationAttributes>
	implements DailyMoodAttributes {
	public id!: number;
	public user_id!: number;
	public local_date!: string;
	public mood!: 'happy' | 'calm' | 'focused' | 'relaxed';
}

DailyMood.init(
	{
		id: {
			type: DataTypes.BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
		},
		local_date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		mood: {
			type: DataTypes.STRING(20),
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'daily_mood',
		tableName: 'daily_moods',
		timestamps: false,
		underscored: true,
		indexes: [
			{ fields: ['user_id'] },
			{ fields: ['local_date'] },
			{ unique: true, fields: ['user_id', 'local_date'] },
		],
	}
);

export default DailyMood;

