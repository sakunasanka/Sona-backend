import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
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

	// Custom toJSON method to ensure encrypted fields are properly decrypted in API responses
	toJSON() {
		const values = Object.assign({}, this.get());
		// The getters will automatically decrypt the values when accessed
		return {
			...values,
			valence: this.valence,
			arousal: this.arousal,
			intensity: this.intensity,
			mood: this.mood
		};
	}
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
			type: DataTypes.TEXT,
			allowNull: false,
			get() {
				const rawValue = this.getDataValue('valence' as any);
				if (!rawValue) return 0;
				
				// Handle both encrypted and unencrypted values
				if (isEncrypted(rawValue)) {
					return parseFloat(safeDecrypt(rawValue));
				} else {
					// Legacy data - convert directly if it's a number
					return typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
				}
			},
			set(value: number) {
				// Validate before encrypting
				if (value < -1 || value > 1) {
					throw new Error('Valence must be between -1 and 1');
				}
				this.setDataValue('valence' as any, encrypt(value.toString()));
			}
		},
		arousal: {
			type: DataTypes.TEXT,
			allowNull: false,
			get() {
				const rawValue = this.getDataValue('arousal' as any);
				if (!rawValue) return 0;
				
				// Handle both encrypted and unencrypted values
				if (isEncrypted(rawValue)) {
					return parseFloat(safeDecrypt(rawValue));
				} else {
					// Legacy data - convert directly if it's a number
					return typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
				}
			},
			set(value: number) {
				// Validate before encrypting
				if (value < -1 || value > 1) {
					throw new Error('Arousal must be between -1 and 1');
				}
				this.setDataValue('arousal' as any, encrypt(value.toString()));
			}
		},
		intensity: {
			type: DataTypes.TEXT,
			allowNull: false,
			get() {
				const rawValue = this.getDataValue('intensity' as any);
				if (!rawValue) return 0;
				
				// Handle both encrypted and unencrypted values
				if (isEncrypted(rawValue)) {
					return parseFloat(safeDecrypt(rawValue));
				} else {
					// Legacy data - convert directly if it's a number
					return typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
				}
			},
			set(value: number) {
				// Validate before encrypting
				if (value < 0 || value > 1) {
					throw new Error('Intensity must be between 0 and 1');
				}
				this.setDataValue('intensity' as any, encrypt(value.toString()));
			}
		},
		mood: {
			type: DataTypes.TEXT,
			allowNull: false,
			get() {
				const rawValue = this.getDataValue('mood' as any);
				if (!rawValue) return '';
				
				// Handle both encrypted and unencrypted values
				if (isEncrypted(rawValue)) {
					return safeDecrypt(rawValue);
				} else {
					// Legacy data - return as-is
					return rawValue;
				}
			},
			set(value: string) {
				// Validate before encrypting
				if (value && value.length > 50) {
					throw new Error('Mood must be 50 characters or less');
				}
				this.setDataValue('mood' as any, encrypt(value));
			}
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

