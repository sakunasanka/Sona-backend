import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

export interface ComplaintAttributes {
	complaintId: number;
	additional_details?: string;
	status: 'pending' | 'resolved' | 'rejected';
	proof?: string;
	reason?: string;
	user_id: number;
	session_id: number;
	action_by?: number;
	resolutionReason?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

type ComplaintCreationAttributes = Optional<ComplaintAttributes, 'complaintId' | 'createdAt' | 'updatedAt'>;

class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes>
	implements ComplaintAttributes {
	public complaintId!: number;
	public additional_details?: string;
	public status!: 'pending' | 'resolved' | 'rejected';
	public proof?: string;
	public reason?: string;
	public user_id!: number;
	public session_id!: number;
	public action_by?: number;
	public resolutionReason?: string;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

Complaint.init(
	{
		complaintId: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		additional_details: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		status: {
			type: DataTypes.ENUM('pending', 'resolved', 'rejected'),
			allowNull: false,
			defaultValue: 'pending',
		},
		proof: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		reason: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id',
			},
		},
		session_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'sessions',
				key: 'id',
			},
		},
		action_by: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'users',
				key: 'id',
			},
		},
		resolutionReason: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'resolution_reason',
		},
	},
	{
		sequelize,
		modelName: 'complaint',
		tableName: 'complaints',
		timestamps: true,
		createdAt: 'createdAt',
		updatedAt: 'updatedAt',
		underscored: false,
		indexes: [
			{ fields: ['user_id'] },
			{ fields: ['session_id'] },
			{ fields: ['status'] },
			{ fields: ['action_by'] },
			{ fields: ['reasonID'] },
		],
	}
);

import User from './User';
import Session from './Session';

Complaint.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Complaint.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });
Complaint.belongsTo(User, { foreignKey: 'action_by', as: 'actionByUser' });

export default Complaint;