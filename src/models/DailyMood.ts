import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

export interface DailyMoodAttributes {
	id: number;
	user_id: number;
	local_date: string; // YYYY-MM-DD
	valence: number; // -1 to 1
	arousal: number; // -1 to 1
	intensity: number; // 0 to 1
	mood: string; // Any string up to 50 characters
	created_at?: Date;
	updated_at?: Date;
}

type DailyMoodCreationAttributes = Optional<DailyMoodAttributes, 'id' | 'created_at' | 'updated_at'>;

class DailyMood extends Model<DailyMoodAttributes, DailyMoodCreationAttributes>
	implements DailyMoodAttributes {
	public id!: number;
	public user_id!: number;
	public local_date!: string;
	public valence!: number;
	public arousal!: number;
	public intensity!: number;
	public mood!: string;
	public readonly created_at!: Date;
	public readonly updated_at!: Date;
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
		valence: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: false,
			validate: {
				min: -1,
				max: 1
			}
		},
		arousal: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: false,
			validate: {
				min: -1,
				max: 1
			}
		},
		intensity: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: false,
			validate: {
				min: 0,
				max: 1
			}
		},
		mood: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		modelName: 'daily_mood',
		tableName: 'daily_moods',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		underscored: true,
		indexes: [
			{ fields: ['user_id'] },
			{ fields: ['local_date'] },
			{ unique: true, fields: ['user_id', 'local_date'] },
			{ fields: ['user_id', 'local_date'] },
		],
	}
);

export default DailyMood;

